import asyncio
import aiohttp
import asyncpg
import hashlib
import logging
import sys
from logging.handlers import RotatingFileHandler
import urllib.parse

###############################################################################
# GLOBAL CONFIG
###############################################################################

BASE_URL = "https://192.168.60.168/api/v1.13"
AUTH_TOKEN = (
    "Bearer "
    "NDphcGl1c2VyOjo6VlBoRi9SZlQ1OWxCb0xLMkhtVy9wWXFNZm1BcWFaeVQxK0RR"
    "NnEwSWJuK05lS3RYTHZSYkVsbzowLTdhY2ZhNzgyYjBjMzEyMTM1ZmNjNTg3MWU5"
    "ZGVjMjc5NGU4ZWNjZjE0MTk3YWQyOTc3OTAyMmE4MGQwNWVjNzU="
)

DB_CONFIG = {
    "host": "192.168.60.126",
    "port": 5432,
    "database": "postgres",
    "user": "postgres",
    "password": "yunusemre"
}
DB_SCHEMA = "deneme"
CONCURRENCY_LIMIT = 50

# Node türlerine göre alınacak sütunların konfigürasyonu
NODE_TYPE_COLUMNS = {
    "Host": ["id", "key", "uuid", "name", "logical_ram", "dns_domain", "__all_ip_addrs", "__all_mac_addrs"],  # Host için örnek sütunlar
    "VirtualMachine": ["id", "key", "uuid", "name"],  # VirtualMachine için örnek sütunlar
    "SoftwareInstance": ["id", "key", "uuid", "name", "vendor", "publisher"],  # SoftwareInstance için sütunlar ekledik
    # Diğer node türleri için sütunlar buraya eklenebilir
}

# Timeout ve retry ayarları
REQUEST_TIMEOUT = 300  # 5 dakika
MAX_RETRIES = 3
RETRY_DELAY = 5  # saniye

# Özel sorguların konfigürasyonu - ihtiyaç duydukça buraya ekleme yapılabilir
CUSTOM_QUERY_CONFIGS = {
    # SoftwareInstance için publisher bilgisi çekme sorgusu (basitleştirilmiş)
    "software_instance_publisher": {
        "table_name": "softwareinstance",
        "query": "search SoftwareInstance show #id as 'nodeid', #ElementWithDetail:SoftwareDetail:PublisherInfo.publisher as 'Publisher'",
        "column_mappings": {
            "nodeid": "id",
            "Publisher": "publisher"
        }
    },
    # Alternative publisher query (basitleştirilmiş)
    "software_instance_publisher_2": {
        "table_name": "softwareinstance",
        "query": "search SoftwareInstance show #id as 'nodeid', #vendor as 'Vendor'",
        "column_mappings": {
            "nodeid": "id",
            "Vendor": "vendor_name"
        }
    }
}

###############################################################################
# LOGGING SETUP
###############################################################################

def setup_logger(
    logger_name: str = "bmc_discovery_logger",
    log_file: str = "bmc_discovery.log",
    file_log_level: int = logging.INFO,
    console_log_level: int = logging.WARNING
):
    logger = logging.getLogger(logger_name)
    logger.setLevel(min(file_log_level, console_log_level))
    logger.propagate = False

    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    file_handler = RotatingFileHandler(log_file, maxBytes=5_000_000, backupCount=3)
    file_handler.setLevel(file_log_level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(console_log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger

logger = setup_logger()

###############################################################################
# HELPER FUNCTIONS
###############################################################################

def flatten_json(json_obj, parent_key="", sep="_"):
    """IP adreslerini işleyip ayrı sütunlara ayıran yardımcı fonksiyon"""
    items = []
    for k, v in json_obj.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_json(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def shorten_column_name(column_name, max_length=63):
    if len(column_name) <= max_length:
        return column_name
    hash_suffix = hashlib.md5(column_name.encode()).hexdigest()[:8]
    shortened_name = column_name[:max_length - len(hash_suffix) - 1] + "_" + hash_suffix
    return shortened_name

###############################################################################
# DATABASE SCHEMA FUNCTIONS
###############################################################################

async def create_table(connection, schema_name, table_name, columns):
    column_definitions = ", ".join(
        f'"{shorten_column_name(col)}" TEXT'
        for col in columns
        if col != "id"
    )
    query = f"""
    CREATE TABLE IF NOT EXISTS {schema_name}.{table_name} (
        id TEXT PRIMARY KEY,
        {column_definitions}
    );
    """
    await connection.execute(query)
    logger.info(f"Table ensured: {schema_name}.{table_name}")

async def ensure_columns_exist(connection, schema_name, table_name, new_columns):
    query = f"""
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = '{schema_name}' AND table_name = '{table_name}';
    """
    existing_columns = {row["column_name"] for row in await connection.fetch(query)}
    processed_columns = {shorten_column_name(col) for col in new_columns}

    missing_columns = processed_columns - existing_columns
    for column in missing_columns:
        alter_query = f'ALTER TABLE {schema_name}.{table_name} ADD COLUMN "{column}" TEXT;'
        await connection.execute(alter_query)
        logger.info(f"Added column '{column}' to {schema_name}.{table_name}")

async def insert_data_with_dynamic_columns(connection, schema_name, table_name, data):
    if not data:
        return

    logger.debug(f"Inserting {len(data)} rows into {schema_name}.{table_name}")

    for record in data:
        await ensure_columns_exist(connection, schema_name, table_name, set(record.keys()))

        converted_record = {
            shorten_column_name(key): str(value) if value is not None else None
            for key, value in record.items()
        }

        columns = ', '.join(f'"{col}"' for col in converted_record.keys())
        values = ', '.join(f"${i+1}" for i in range(len(converted_record)))
        
        # Güncelleme sorgusu için SET kısmını hazırla
        update_parts = []
        for col in converted_record.keys():
            if col != "id":  # id'yi güncelleme
                update_parts.append(f'"{col}" = EXCLUDED."{col}"')
        
        update_clause = ", ".join(update_parts)
        
        # Eğer id harici sütun yoksa sadece INSERT yap
        if update_parts:
            query = f"""
            INSERT INTO {schema_name}.{table_name} ({columns})
            VALUES ({values})
            ON CONFLICT (id) DO UPDATE SET {update_clause};
            """
        else:
            query = f"""
            INSERT INTO {schema_name}.{table_name} ({columns})
            VALUES ({values})
            ON CONFLICT (id) DO NOTHING;
            """
            
        await connection.execute(query, *converted_record.values())

    logger.info(f"Inserted {len(data)} records into {schema_name}.{table_name}")

###############################################################################
# API REQUEST FUNCTIONS
###############################################################################

async def make_request_with_retry(session, url, headers, params=None, max_retries=MAX_RETRIES):
    """Retry mekanizması ile API isteklerini yapan yardımcı fonksiyon"""
    for attempt in range(max_retries):
        try:
            # Exponential backoff için bekleme süresi
            wait_time = RETRY_DELAY * (2 ** attempt)
            
            async with session.get(
                url,
                headers=headers,
                params=params,
                ssl=False,
                timeout=REQUEST_TIMEOUT
            ) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 502:
                    error_text = await response.text()
                    logger.warning(f"Service unavailable (502) on attempt {attempt + 1}, waiting {wait_time} seconds before retry")
                    await asyncio.sleep(wait_time)
                    continue
                elif response.status == 500:
                    error_text = await response.text()
                    logger.warning(f"Server error (500) on attempt {attempt + 1}, waiting {wait_time} seconds before retry. Error: {error_text[:200]}")
                    await asyncio.sleep(wait_time)
                    if attempt == max_retries - 1:
                        logger.error(f"Request failed with status 500 after {max_retries} attempts: {error_text[:200]}")
                        return None
                    continue
                elif response.status == 400:
                    error_text = await response.text()
                    
                    # Özellikle results_id ve offset hatalarını kontrol et
                    if "offset cannot be specified without 'results_id'" in error_text:
                        logger.error(f"Pagination error: {error_text}")
                        # Params'ta offset varsa ama results_id yoksa, offset'i kaldır
                        if params and "offset" in params and "results_id" not in params:
                            logger.warning("Removing offset parameter since results_id is missing")
                            params_copy = params.copy()
                            params_copy.pop("offset", None)
                            # Tekrar dene (modifiye edilmiş parametrelerle)
                            async with session.get(
                                url,
                                headers=headers,
                                params=params_copy,
                                ssl=False,
                                timeout=REQUEST_TIMEOUT
                            ) as retry_response:
                                if retry_response.status == 200:
                                    return await retry_response.json()
                                else:
                                    retry_error = await retry_response.text()
                                    logger.error(f"Retry still failed with status {retry_response.status}: {retry_error}")
                                    return None
                        return None
                    elif "auto-logout" in error_text:
                        logger.warning(f"Session expired on attempt {attempt + 1}, retrying...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"Request failed with status {response.status}: {error_text}")
                        return None
                else:
                    error_text = await response.text()
                    logger.error(f"Request failed with status {response.status}: {error_text}")
                    if response.status >= 500:  # Server errors
                        if attempt < max_retries - 1:
                            logger.warning(f"Server error, retrying in {wait_time} seconds")
                            await asyncio.sleep(wait_time)
                            continue
                    return None
        except asyncio.TimeoutError:
            logger.warning(f"Request timed out on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                await asyncio.sleep(wait_time)
                continue
            raise
        except Exception as e:
            logger.error(f"Unexpected error on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(wait_time)
                continue
            raise

    return None

async def fetch_all_nodes(session, node_type):
    """
    /data/kinds/{node_type} endpoint'ini kullanarak verileri çeker.
    Limit parametresi kaldırıldı; API'nin varsayılanı kullanılarak pagination varsa
    next_offset ile tüm kayıtlar çekilir.
    """
    url = f"{BASE_URL}/data/kinds/{node_type}"
    headers = {"accept": "application/json", "Authorization": AUTH_TOKEN}
    params = {"delete": "false"}

    all_results = []
    page_count = 0
    logger.info(f"Fetching all nodes for node_type={node_type}")

    while True:
        try:
            page_count += 1
            logger.debug(f"Fetching page {page_count} for node_type={node_type}")
            
            response = await make_request_with_retry(session, url, headers, params)
            if not response:
                logger.error(f"Failed to fetch nodes for {node_type} after retries")
                break
                
            if not response or "results" not in response[0]:
                logger.warning(f"No 'results' found in response for {node_type}.")
                break

            results = response[0]["results"]
            batch_size = len(results)
            all_results.extend(results)

            if page_count % 10 == 0 or batch_size < 100:  # Her 10 sayfada bir veya son sayfalarda log
                logger.info(f"Progress: Fetched {len(all_results)} {node_type} records so far (page {page_count}, batch size {batch_size})")

            next_offset = response[0].get("next_offset")
            results_id = response[0].get("results_id")

            # Offset değerini logla
            if next_offset is not None:
                logger.debug(f"Next offset for {node_type}: {next_offset}")

            # Önemli değişiklik: results_id ve offset yönetimi
            # results_id varsa, offset'i sadece results_id ile birlikte kullan
            if next_offset is not None and results_id:
                params["results_id"] = results_id
                params["offset"] = next_offset
                logger.debug(f"Fetching next page for node_type={node_type}, offset={next_offset}, results_id={results_id}")
                
                # Büyük veri setlerinde oluşabilecek bellek problemlerini önlemek için
                if len(all_results) > 100000 and page_count % 50 == 0:
                    logger.info(f"Large dataset handling: collected {len(all_results)} records, allowing GC to run")
                    await asyncio.sleep(0.1)  # Give the event loop a chance to breathe
            else:
                # Offset ve results_id yoksa veya sadece birisi varsa, döngüden çık
                if next_offset is None:
                    logger.debug(f"No more pages for node_type={node_type} (no next_offset)")
                elif not results_id:
                    logger.warning(f"Missing results_id for node_type={node_type} with offset={next_offset}")
                break
                
        except Exception as e:
            logger.error(f"Error in fetch_all_nodes for {node_type}: {str(e)}")
            # Hata durumunda kısa bir bekleme ekle ve devam et
            await asyncio.sleep(RETRY_DELAY)
            break

    logger.info(f"Completed: Fetched total {len(all_results)} nodes for {node_type} in {page_count} pages")
    return all_results

async def fetch_node_details(node_id, session, semaphore):
    """Belirtilen node_id için detayları çeker."""
    url = f"{BASE_URL}/data/nodes/{node_id}"
    headers = {"accept": "application/json", "Authorization": AUTH_TOKEN}

    async with semaphore:
        async with session.get(url, headers=headers, ssl=False) as response:
            if response.status == 200:
                logger.debug(f"Fetched details for node_id={node_id}")
                return await response.json()
            else:
                logger.error(f"Error fetching details for node={node_id}, status={response.status}")
                return None

async def fetch_host_additional_info(session):
    """
    /data/search endpoint'ini kullanarak
    name, nodeid, Uptime Days, creation_time verilerini çeker.
    """
    query_str = (
        "search Host show name, #id as 'nodeid', "
        "#InferredElement:Inference:Primary:HostInfo.uptime as 'Uptime Days', "
        "friendlyTime(creationTime(#)) as 'creation_time'"
    )
    encoded_query = urllib.parse.quote(query_str, safe="")
    url = f"{BASE_URL}/data/search?query={encoded_query}"
    headers = {"accept": "application/json", "Authorization": AUTH_TOKEN}

    all_rows = []
    params = {}  # Initialize empty params

    while True:
        data = await make_request_with_retry(session, url, headers, params)
        
        if not data:
            logger.error("Failed to fetch Host additional info after retries")
            break

        if not data or "results" not in data[0]:
            logger.warning("No 'results' found in response for Host additional info.")
            break

        results = data[0]["results"]
        for row in results:
            host_name = row[0]
            nodeid = row[1]
            uptime_days = row[2]
            creation_time = row[3]

            all_rows.append({
                "id": nodeid,
                "name": host_name,
                "uptime_days": uptime_days,
                "creation_time": creation_time
            })

        next_offset = data[0].get("next_offset")
        results_id = data[0].get("results_id")
        
        # Önemli değişiklik: results_id ve offset yönetimi
        # results_id varsa, offset'i sadece results_id ile birlikte kullan
        if next_offset is not None and results_id:
            params["results_id"] = results_id
            params["offset"] = next_offset
            logger.debug(f"Fetching next page for Host additional info, offset={next_offset}, results_id={results_id}")
        else:
            # Offset ve results_id yoksa veya sadece birisi varsa, döngüden çık
            logger.debug(f"No more pages for Host additional info")
            break

    logger.info(f"Fetched {len(all_rows)} Host rows with uptime & creation_time info.")
    return all_rows

###############################################################################
# RELATIONSHIPS FUNCTIONS
###############################################################################

async def ensure_relationships_table_exists(connection, schema_name):
    query = f"""
    CREATE TABLE IF NOT EXISTS {schema_name}.relationships (
        "rel_id" TEXT PRIMARY KEY,
        "kind" TEXT,
        "src_id" TEXT,
        "src_role" TEXT,
        "src_kind" TEXT,
        "tgt_id" TEXT,
        "tgt_role" TEXT,
        "tgt_kind" TEXT
    );
    """
    await connection.execute(query)
    logger.info(f"Table ensured: {schema_name}.relationships")

async def process_relationships(connection, node_id, session, node_kind_cache):
    focus_types = ["software-connected", "software", "infrastructure"]
    headers = {"accept": "application/json", "Authorization": AUTH_TOKEN}
    
    # Toplu insert için buffer
    relationships_buffer = []
    BATCH_SIZE = 100  # Batch size'ı küçülttük
    MAX_RETRIES = 3
    RETRY_DELAY = 5
    
    # İzin verilen target kind türleri
    ALLOWED_TARGET_KINDS = {
        "SoftwareInstance", 
        "CandidateSoftwareInstance", 
        "DiskDrive", 
        "FileSystem", 
        "VirtualMachine"
    }

    async def get_node_kind(node_id):
        if node_id not in node_kind_cache:
            details = await fetch_node_details(node_id, session, asyncio.Semaphore(CONCURRENCY_LIMIT))
            node_kind_cache[node_id] = details.get("kind", "unknown") if details else "unknown"
        return node_kind_cache[node_id]

    async def flush_buffer():
        if not relationships_buffer:
            return
            
        for retry in range(MAX_RETRIES):
            try:
                async with connection.transaction():
                    # Toplu insert için query oluştur
                    values_template = ",".join(f"(${i*8 + 1}, ${i*8 + 2}, ${i*8 + 3}, ${i*8 + 4}, ${i*8 + 5}, ${i*8 + 6}, ${i*8 + 7}, ${i*8 + 8})"
                                             for i in range(len(relationships_buffer)))
                    query = f"""
                    INSERT INTO {DB_SCHEMA}.relationships (
                        "rel_id", "kind", "src_id", "src_role", "src_kind",
                        "tgt_id", "tgt_role", "tgt_kind"
                    ) VALUES {values_template}
                    ON CONFLICT ("rel_id") DO NOTHING;
                    """
                    
                    # Parametreleri düzleştir
                    flat_params = []
                    for rel in relationships_buffer:
                        flat_params.extend([
                            rel["rel_id"], rel["kind"], rel["src_id"], rel["src_role"],
                            rel["src_kind"], rel["tgt_id"], rel["tgt_role"], rel["tgt_kind"]
                        ])
                    
                    await connection.execute(query, *flat_params)
                    logger.debug(f"Successfully inserted {len(relationships_buffer)} relationships")
                    relationships_buffer.clear()
                    return
            except asyncpg.DeadlockDetectedError:
                if retry < MAX_RETRIES - 1:
                    logger.warning(f"Deadlock detected, retrying in {RETRY_DELAY} seconds (attempt {retry + 1}/{MAX_RETRIES})")
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    logger.error("Max retries reached for deadlock, falling back to single inserts")
                    # Tek tek insert dene
                    for rel in relationships_buffer:
                        try:
                            async with connection.transaction():
                                single_query = f"""
                                INSERT INTO {DB_SCHEMA}.relationships (
                                    "rel_id", "kind", "src_id", "src_role", "src_kind",
                                    "tgt_id", "tgt_role", "tgt_kind"
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                                ON CONFLICT ("rel_id") DO NOTHING;
                                """
                                await connection.execute(
                                    single_query,
                                    rel["rel_id"], rel["kind"], rel["src_id"], rel["src_role"],
                                    rel["src_kind"], rel["tgt_id"], rel["tgt_role"], rel["tgt_kind"]
                                )
                        except Exception as inner_e:
                            logger.error(f"Error inserting single relationship: {str(inner_e)}")
                    relationships_buffer.clear()
            except Exception as e:
                logger.error(f"Error in flush_buffer: {str(e)}")
                if retry < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    relationships_buffer.clear()

    try:
        for focus in focus_types:
            url = f"{BASE_URL}/data/nodes/{node_id}/graph"
            params = {"focus": focus, "apply_rules": "true", "complete": "false"}

            data = await make_request_with_retry(session, url, headers, params)
            
            if data:
                links = data.get("links", [])
                logger.debug(f"Node {node_id}, focus={focus}, found {len(links)} links")

                for link in links:
                    src_id = link["src_id"]
                    tgt_id = link["tgt_id"]
                    
                    # Node türlerini paralel olarak al
                    src_kind, tgt_kind = await asyncio.gather(
                        get_node_kind(src_id) if not link.get("src_kind") else asyncio.sleep(0, result=link.get("src_kind")),
                        get_node_kind(tgt_id) if not link.get("tgt_kind") else asyncio.sleep(0, result=link.get("tgt_kind"))
                    )

                    # Sadece hedef (target) kind'ı izin verilen türlerden biriyse ilişkiyi ekle
                    if tgt_kind in ALLOWED_TARGET_KINDS:
                        relationships_buffer.append({
                            "rel_id": link["rel_id"],
                            "kind": link.get("kind"),
                            "src_id": src_id,
                            "src_role": link["src_role"],
                            "src_kind": src_kind,
                            "tgt_id": tgt_id,
                            "tgt_role": link["tgt_role"],
                            "tgt_kind": tgt_kind
                        })

                        # Buffer dolduğunda veritabanına yaz
                        if len(relationships_buffer) >= BATCH_SIZE:
                            await flush_buffer()
            else:
                logger.error(f"Error fetching relationships for node={node_id}, focus={focus}")
                await asyncio.sleep(RETRY_DELAY)

        # Kalan buffer'ı temizle
        if relationships_buffer:
            await flush_buffer()
            
    except Exception as e:
        logger.error(f"Error in process_relationships for node {node_id}: {str(e)}")
        if relationships_buffer:
            await flush_buffer()

###############################################################################
# RETIRED HOSTS FUNCTIONS
###############################################################################

async def fetch_retired_hosts(session):
    """
    Emeklilik (retired) olmuş Host bilgilerini çeken endpoint.
    Pagination için results_id kullanılarak, doğru şekilde tüm kayıtlar çekilir.
    """
    url = (
        f"{BASE_URL}/data/search?"
        "query=Search%20FLAGS%28include_destroyed%2C%20exclude_current%29%20Host%20"
        "show%20name%2CfriendlyTime%28destructionTime%28%23%29%29%2Ckey%2C%23id"
    )
    headers = {"accept": "application/json", "Authorization": AUTH_TOKEN}
    
    # Başlangıçta boş params ile başla
    params = {}
    all_results = []
    page_count = 0
    
    logger.info("Fetching retired hosts data")
    logger.info(f"Using URL: {url}")  # URL'yi logla
    
    while True:
        try:
            page_count += 1
            response = await make_request_with_retry(session, url, headers, params)
            
            # API yanıtını detaylı logla
            logger.info(f"API Response for retired hosts: {response}")
            
            if not response:
                logger.error("Failed to fetch retired hosts after retries")
                break
                
            if "results" not in response[0]:
                logger.warning(f"No 'results' found in response for retired hosts. Full response: {response}")
                break
                
            results = response[0]["results"]
            all_results.extend(results)
            logger.debug(f"Fetched {len(results)} retired hosts on page {page_count}")
            
            next_offset = response[0].get("next_offset")
            results_id = response[0].get("results_id")
            
            # Pagination detaylarını logla
            logger.info(f"Pagination details - next_offset: {next_offset}, results_id: {results_id}")
            
            # results_id varsa, offset'i sadece results_id ile birlikte kullan
            if next_offset is not None and results_id:
                params["results_id"] = results_id
                params["offset"] = next_offset
                logger.debug(f"Fetching next page for retired hosts, offset={next_offset}, results_id={results_id}")
            else:
                # Offset ve results_id yoksa veya sadece birisi varsa, döngüden çık
                logger.debug("No more pages for retired hosts")
                break
                
        except Exception as e:
            logger.error(f"Error in fetch_retired_hosts: {str(e)}")
            logger.error(f"Error details: {str(e.__class__.__name__)}")  # Hata tipini logla
            break
            
    logger.info(f"Completed: Fetched {len(all_results)} retired hosts in {page_count} pages")
    logger.info(f"Sample of fetched data: {all_results[:5] if all_results else 'No data'}")  # Örnek veriyi logla
    return all_results

async def process_retired_hosts(connection, session):
    """
    fetch_retired_hosts() ile gelen verileri alır,
    retired tablosu oluşturur ve verileri upsert yöntemiyle ekler.
    """
    logger.info("Starting process_retired_hosts function")
    results = await fetch_retired_hosts(session)
    
    logger.info(f"Received results type: {type(results)}")
    logger.info(f"Received results length: {len(results) if results else 0}")
    
    if not results or not isinstance(results, list) or len(results) == 0:
        logger.warning("No data found for retired hosts or fetch failed.")
        return
    
    try:
        # Önce şema ve tablo varlığını kontrol et
        schema_check_query = """
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.schemata 
            WHERE schema_name = $1
        );
        """
        schema_exists = await connection.fetchval(schema_check_query, DB_SCHEMA)
        
        if not schema_exists:
            logger.info(f"Creating schema {DB_SCHEMA}")
            await connection.execute(f"CREATE SCHEMA IF NOT EXISTS {DB_SCHEMA};")
        
        # Tabloyu oluştur
        create_query = f"""
        CREATE TABLE IF NOT EXISTS {DB_SCHEMA}.retired (
            name TEXT PRIMARY KEY,
            friendly_time TEXT,
            key TEXT,
            node_id TEXT
        );
        """
        logger.info(f"Executing create table query: {create_query}")
        await connection.execute(create_query)
        logger.info(f"Table ensured: {DB_SCHEMA}.retired")
        
        # Ensure all required columns exist
        required_columns = ["friendly_time", "key", "node_id"]
        for column in required_columns:
            column_check_query = f"""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = '{DB_SCHEMA}'
                AND table_name = 'retired'
                AND column_name = '{column}'
            );
            """
            column_exists = await connection.fetchval(column_check_query)
            if not column_exists:
                logger.info(f"Adding missing column '{column}' to {DB_SCHEMA}.retired")
                await connection.execute(f"ALTER TABLE {DB_SCHEMA}.retired ADD COLUMN {column} TEXT;")
        
        # Verify table exists
        verify_query = f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '{DB_SCHEMA}' AND table_name = 'retired');"
        table_exists = await connection.fetchval(verify_query)
        logger.info(f"Table existence verification: {table_exists}")
        
        # First deduplicate the results by name (keeping the latest entry)
        deduplicated_results = {}
        for record in results:
            logger.debug(f"Processing record: {record}")
            if len(record) >= 4:  # Ensure the record has all required fields
                name = record[0]
                friendly_time = record[1]
                key = record[2]
                node_id = record[3]
                # If duplicate found, only keep the latest entry
                deduplicated_results[name] = (friendly_time, key, node_id)
            else:
                logger.warning(f"Skipping invalid record: {record}")
        
        # Convert back to list of records
        unique_results = [[name, *values] for name, values in deduplicated_results.items()]
        
        logger.info(f"Deduplicated {len(results)} records to {len(unique_results)} unique records")
        
        if len(unique_results) == 0:
            logger.warning("No valid records to insert after deduplication")
            return
            
        # Batch insert with error handling
        batch_size = 100  # Küçük batch size ile daha güvenli
        processed_count = 0
        
        for i in range(0, len(unique_results), batch_size):
            batch = unique_results[i:i+batch_size]
            for retry in range(MAX_RETRIES):
                try:
                    async with connection.transaction():
                        # Prepare values for bulk insert
                        values = []
                        for record in batch:
                            name = record[0]
                            friendly_time = record[1]
                            key = record[2]
                            node_id = record[3]
                            values.extend([name, friendly_time, key, node_id])
                        
                        if not values:
                            logger.warning(f"Empty values for batch {i//batch_size + 1}")
                            continue
                            
                        # Create the placeholders for the query
                        placeholders = ", ".join(f"(${j*4 + 1}, ${j*4 + 2}, ${j*4 + 3}, ${j*4 + 4})" for j in range(len(batch)))
                        
                        # Build and execute the query
                        query = f"""
                        INSERT INTO {DB_SCHEMA}.retired (name, friendly_time, key, node_id)
                        VALUES {placeholders}
                        ON CONFLICT (name) DO UPDATE
                        SET friendly_time = EXCLUDED.friendly_time,
                            key = EXCLUDED.key,
                            node_id = EXCLUDED.node_id;
                        """
                        
                        logger.debug(f"Executing batch insert query with {len(batch)} records")
                        await connection.execute(query, *values)
                        processed_count += len(batch)
                        logger.info(f"Processed {len(batch)} retired host records ({processed_count}/{len(unique_results)} total)")
                        break  # Başarılı olursa retry döngüsünden çık
                        
                except asyncpg.DeadlockDetectedError:
                    if retry < MAX_RETRIES - 1:
                        wait_time = RETRY_DELAY * (2 ** retry)
                        logger.warning(f"Deadlock detected in retired hosts, retrying in {wait_time} seconds (attempt {retry + 1}/{MAX_RETRIES})")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error("Max retries reached for deadlock in retired hosts, trying single inserts")
                        # Tek tek insert dene
                        for record in batch:
                            try:
                                async with connection.transaction():
                                    await connection.execute(
                                        f"""
                                        INSERT INTO {DB_SCHEMA}.retired (name, friendly_time, key, node_id)
                                        VALUES ($1, $2, $3, $4)
                                        ON CONFLICT (name) DO UPDATE
                                        SET friendly_time = EXCLUDED.friendly_time,
                                            key = EXCLUDED.key,
                                            node_id = EXCLUDED.node_id;
                                        """,
                                        record[0], record[1], record[2], record[3]
                                    )
                                processed_count += 1
                            except Exception as e:
                                logger.error(f"Error in single retired host insert: {str(e)}")
                except Exception as e:
                    if retry < MAX_RETRIES - 1:
                        wait_time = RETRY_DELAY * (2 ** retry)
                        logger.error(f"Error processing batch of retired hosts (attempt {retry + 1}): {str(e)}")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"Failed to process batch after {MAX_RETRIES} attempts: {str(e)}")
                        break
        
        # Verify the results
        count_query = f"SELECT COUNT(*) FROM {DB_SCHEMA}.retired;"
        final_count = await connection.fetchval(count_query)
        logger.info(f"Final retired hosts count in database: {final_count}")
        
        if final_count < processed_count:
            logger.warning(f"Some records may have been lost: Processed {processed_count}, but found {final_count} in database")
        
    except Exception as e:
        logger.error(f"Critical error in process_retired_hosts: {str(e)}")
        raise
        
    logger.info(f"Processed total of {processed_count} retired host records")

###############################################################################
# HOST ADDITIONAL INFO UPDATE
###############################################################################

async def update_host_uptime_creation(connection, schema_name, session):
    """
    fetch_host_additional_info() ile çekilen ek verileri,
    host tablosuna upsert yöntemiyle ekler/günceller.
    """
    try:
        data = await fetch_host_additional_info(session)
        if not data:
            logger.warning("No additional Host info fetched or fetch failed.")
            return

        logger.info(f"Processing {len(data)} host records for uptime and creation time.")
        
        # Veri kalitesi kontrolü - kayıp değerleri logla
        null_uptime_count = sum(1 for item in data if item["uptime_days"] is None)
        null_creation_count = sum(1 for item in data if item["creation_time"] is None)
        
        # uptime_days null olması sorun değil, sadece bilgi için debug seviyesinde logla
        if null_uptime_count > 0:
            logger.debug(f"{null_uptime_count} out of {len(data)} hosts have NULL uptime_days")
        
        if null_creation_count > 0:
            logger.warning(f"{null_creation_count} out of {len(data)} hosts have NULL creation_time")

        table_name = "host"  # 'Host' verilerini lowercase olarak kullanıyoruz.
        columns_to_add = {"uptime_days", "creation_time"}
        await ensure_columns_exist(connection, schema_name, table_name, columns_to_add)

        # Toplu update için
        batch_size = 500  # Daha küçük batch size ile daha güvenli
        processed_count = 0
        
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            
            try:
                # Daha güvenli bir yöntem: Her güncellemede bir transaction kullan
                async with connection.transaction():
                    # Toplu update query oluştur
                    values = []
                    for record in batch:
                        # Null değerleri kontrol et
                        uptime_days_value = None
                        creation_time_value = None
                        
                        if record["uptime_days"] is not None:
                            try:
                                uptime_days_value = str(record["uptime_days"])
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Invalid uptime_days value for host {record['id']}: {e}")
                                
                        if record["creation_time"] is not None:
                            try:
                                creation_time_value = str(record["creation_time"])
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Invalid creation_time value for host {record['id']}: {e}")
                        
                        values.extend([
                            record["id"],
                            uptime_days_value,
                            creation_time_value
                        ])
                    
                    placeholders = ", ".join(f"(${j*3 + 1}, ${j*3 + 2}, ${j*3 + 3})" for j in range(len(batch)))
                    query = f"""
                    INSERT INTO {schema_name}.{table_name} (id, uptime_days, creation_time)
                    VALUES {placeholders}
                    ON CONFLICT (id) DO UPDATE
                    SET uptime_days = EXCLUDED.uptime_days,
                        creation_time = EXCLUDED.creation_time;
                    """
                    
                    await connection.execute(query, *values)
                    processed_count += len(batch)
                    logger.debug(f"Updated {len(batch)} Host records with uptime & creation_time ({processed_count}/{len(data)} total)")
            
            except Exception as e:
                logger.error(f"Error updating batch {i//batch_size + 1}: {str(e)}")
                # Hata durumunda işlemi durdurmak yerine devam et

        logger.info(f"Updated {processed_count} of {len(data)} Host records with uptime_days & creation_time.")
    
    except Exception as e:
        logger.error(f"Error in update_host_uptime_creation: {str(e)}")
        # Ana hatada işlemi durdur

###############################################################################
# DYNAMIC CUSTOM QUERY EXECUTION
###############################################################################

async def execute_custom_query_and_update(connection, schema_name, session, query_key):
    """
    Özel sorguları çalıştırıp, sonuçları ilgili tablolara uygulayan dinamik fonksiyon.
    Bu sayede farklı API sorgularını tek bir fonksiyonla yönetebiliriz.
    """
    try:
        # Sorgu konfigürasyonunu al
        if query_key not in CUSTOM_QUERY_CONFIGS:
            logger.error(f"Custom query key '{query_key}' not found in configuration")
            return
            
        config = CUSTOM_QUERY_CONFIGS[query_key]
        table_name = config["table_name"]
        query_str = config["query"]
        column_mappings = config["column_mappings"]
        filters = config.get("filters", {})
        
        logger.info(f"Executing custom query '{query_key}' for table '{table_name}'")
        
        # Sorguyu URL'ye çevir
        encoded_query = urllib.parse.quote(query_str, safe="")
        url = f"{BASE_URL}/data/search?query={encoded_query}"
        headers = {"accept": "application/json", "Authorization": AUTH_TOKEN}
        
        # Sorguyu çalıştır ve sonuçları topla
        all_rows = []
        params = {}
        
        retry_count = 0
        max_query_retries = MAX_RETRIES * 2  # Custom query için daha fazla retry
        
        while retry_count < max_query_retries:
            try:
                data = await make_request_with_retry(session, url, headers, params)
                
                if not data:
                    logger.warning(f"No data returned for custom query '{query_key}', attempt {retry_count+1}/{max_query_retries}")
                    retry_count += 1
                    wait_time = RETRY_DELAY * (2 ** min(retry_count, 4))  # Max 80 seconds wait
                    logger.info(f"Waiting {wait_time} seconds before retrying custom query")
                    await asyncio.sleep(wait_time)
                    continue
                
                if "results" not in data[0]:
                    logger.warning(f"No 'results' found in response for custom query '{query_key}'")
                    if "error" in data[0]:
                        logger.error(f"API returned error: {data[0]['error']}")
                    logger.info(f"Raw API response: {data[0]}")
                    break
                
                # Successfully got results
                results = data[0]["results"]
                logger.debug(f"Received {len(results)} results for query '{query_key}'")
                
                # Sütun bilgilerini logla
                if data[0].get("columns"):
                    logger.debug(f"API columns: {data[0]['columns']}")
                
                for row in results:
                    # Sonuçları yapılandırmada belirtilen sütun eşleştirmesine göre işle
                    processed_row = {}
                    for i, column_name in enumerate(data[0].get("columns", [])):
                        if column_name in column_mappings and i < len(row):
                            target_column = column_mappings[column_name]
                            processed_row[target_column] = row[i]
                    
                    # Gerekli sütunlar varsa ekle
                    if "id" in processed_row and len(processed_row) > 1:
                        # Merge publisher fields
                        if "publisher" in processed_row and not processed_row["publisher"] and "alt_publisher" in processed_row and processed_row["alt_publisher"]:
                            processed_row["publisher"] = processed_row["alt_publisher"]
                        
                        all_rows.append(processed_row)
                
                # Pagination kontrolü
                next_offset = data[0].get("next_offset")
                results_id = data[0].get("results_id")
                
                if next_offset is not None and results_id:
                    params["results_id"] = results_id
                    params["offset"] = next_offset
                    logger.debug(f"Fetching next page for custom query '{query_key}', offset={next_offset}")
                    retry_count = 0  # Başarılı bir sayfa alma durumunda retry sayacını sıfırla
                else:
                    # Successfully completed or no more pages
                    break
                    
            except Exception as e:
                logger.error(f"Error in custom query '{query_key}': {str(e)}")
                retry_count += 1
                wait_time = RETRY_DELAY * (2 ** min(retry_count, 4))
                logger.warning(f"Error fetching custom query data, retrying in {wait_time} seconds (attempt {retry_count}/{max_query_retries})")
                await asyncio.sleep(wait_time)
                if retry_count >= max_query_retries:
                    logger.error(f"Max retries reached for custom query '{query_key}'")
                    break
        
        logger.info(f"Fetched {len(all_rows)} rows for custom query '{query_key}'")
        
        # Eğer hiç veri çekilemediyse ve publisher sorgusu ise, uygun bir fallback çözüm uygula
        if not all_rows and query_key.startswith("software_instance_publisher"):
            logger.warning(f"No data fetched for '{query_key}', skipping database update")
            return  # Veri yoksa güncelleme için değil devam et
        
        # Her bir publisher değerini logla
        publisher_values = set()
        for row in all_rows:
            if "publisher" in row and row["publisher"]:
                publisher_values.add(row["publisher"])
        
        logger.info(f"Unique publisher values found: {len(publisher_values)}")
        if publisher_values:
            logger.info(f"Publisher values sample: {list(publisher_values)[:10]}")
        
        # Tablo ve sütunların varlığını kontrol et
        columns_to_add = set()
        for row in all_rows:
            for column in row.keys():
                if column != "id":  # id zaten var
                    columns_to_add.add(column)
        
        if columns_to_add:
            await ensure_columns_exist(connection, schema_name, table_name, columns_to_add)
        
        # Verileri tabloya ekle
        if all_rows:
            # Toplu update için
            batch_size = 100
            processed_count = 0
            
            for i in range(0, len(all_rows), batch_size):
                batch = all_rows[i:i + batch_size]
                
                try:
                    async with connection.transaction():
                        for row in batch:
                            columns = ", ".join([f'"{col}"' for col in row.keys()])
                            placeholders = ", ".join([f"${i+1}" for i in range(len(row))])
                            
                            update_parts = []
                            for col in row.keys():
                                if col != "id":  # id'yi güncelleme
                                    update_parts.append(f'"{col}" = EXCLUDED."{col}"')
                            
                            update_clause = ", ".join(update_parts)
                            
                            query = f"""
                            INSERT INTO {schema_name}.{table_name} ({columns})
                            VALUES ({placeholders})
                            ON CONFLICT (id) DO UPDATE SET {update_clause};
                            """
                            
                            await connection.execute(query, *row.values())
                        
                        processed_count += len(batch)
                        logger.debug(f"Updated {len(batch)} rows for custom query '{query_key}' ({processed_count}/{len(all_rows)} total)")
                
                except Exception as e:
                    logger.error(f"Error updating batch for custom query '{query_key}': {str(e)}")
                    
            logger.info(f"Updated {processed_count} of {len(all_rows)} rows for custom query '{query_key}'")
        else:
            logger.warning(f"No data to update for custom query '{query_key}'")
    
    except Exception as e:
        logger.error(f"Error in execute_custom_query_and_update for '{query_key}': {str(e)}")

###############################################################################
# CORE PROCESS
###############################################################################

async def process_node_type(connection, schema_name, node_type, session):
    logger.info(f"Processing node type: {node_type}")

    # Konfigürasyondan sütunları al, yoksa sadece id sütununu kullan
    desired_columns = NODE_TYPE_COLUMNS.get(node_type, ["id"])
    logger.info(f"Using columns for {node_type}: {desired_columns}")

    all_results = await fetch_all_nodes(session, node_type)
    if not all_results:
        logger.error(f"No results found for {node_type}")
        return
        
    node_ids = [result[0] for result in all_results]

    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    tasks = [fetch_node_details(node_id, session, semaphore) for node_id in node_ids]
    raw_data = await asyncio.gather(*tasks)

    # Eğer __all_ip_addrs ihtiyacı varsa, bunu ipv4 ve ipv6 ile değiştir
    final_columns = list(desired_columns)  # Orijinal sütunların kopyasını oluştur
    if "__all_ip_addrs" in final_columns:
        # __all_ip_addrs'ı çıkar, yerine ipv4 ve ipv6 sütunlarını ekle
        final_columns.remove("__all_ip_addrs")
        if "ipv4" not in final_columns:
            final_columns.append("ipv4")
        if "ipv6" not in final_columns:
            final_columns.append("ipv6")

    # __all_mac_addrs için de benzer işlem yap
    if "__all_mac_addrs" in final_columns:
        # __all_mac_addrs'ı çıkar, yerine mac_addresses sütununu ekle
        final_columns.remove("__all_mac_addrs")
        if "mac_addresses" not in final_columns:
            final_columns.append("mac_addresses")

    flattened_data = []
    for node_id, item in zip(node_ids, raw_data):
        if item:
            # Düzleştirme işlemini yap
            flattened = flatten_json(item)
            # İstenen sütunları filtrele
            filtered_data = {"id": node_id}  # id her zaman olacak
            
            # __all_ip_addrs özel işlemi
            has_ip_addrs = False
            for col in desired_columns:
                if col == "__all_ip_addrs":
                    has_ip_addrs = True
                    # IP adreslerini bul
                    ip_addrs = None
                    if col in flattened:
                        ip_addrs = flattened[col]
                    else:
                        # Sütun adını içeren herhangi bir alanı ara
                        matching_keys = [k for k in flattened.keys() if k.endswith(f"_{col}") or k.endswith(f".{col}")]
                        if matching_keys:
                            ip_addrs = flattened[matching_keys[0]]
                    
                    # IP adreslerini IPv4 ve IPv6 olarak ayır
                    if ip_addrs:
                        ipv4_list = []
                        ipv6_list = []
                        
                        # IP adreslerini parse et
                        if isinstance(ip_addrs, list):
                            for ip in ip_addrs:
                                # IPv6 adresleri içlerinde : karakteri içerir
                                if ":" in str(ip):
                                    ipv6_list.append(str(ip).strip("'\""))
                                else:
                                    ipv4_list.append(str(ip).strip("'\""))
                        
                        # Listeleri string'e çevir - tırnak işaretlerinden ve parantezlerden kaçınarak
                        filtered_data["ipv4"] = ", ".join(ipv4_list) if ipv4_list else ""
                        filtered_data["ipv6"] = ", ".join(ipv6_list) if ipv6_list else ""
                    else:
                        filtered_data["ipv4"] = ""
                        filtered_data["ipv6"] = ""
                
                # __all_mac_addrs özel işlemi
                elif col == "__all_mac_addrs":
                    # MAC adreslerini bul
                    mac_addrs = None
                    if col in flattened:
                        mac_addrs = flattened[col]
                    else:
                        # Sütun adını içeren herhangi bir alanı ara
                        matching_keys = [k for k in flattened.keys() if k.endswith(f"_{col}") or k.endswith(f".{col}")]
                        if matching_keys:
                            mac_addrs = flattened[matching_keys[0]]
                    
                    # MAC adreslerini temizle ve formatlı şekilde birleştir
                    if mac_addrs and isinstance(mac_addrs, list):
                        mac_list = [str(mac).strip("'\"") for mac in mac_addrs]
                        filtered_data["mac_addresses"] = ", ".join(mac_list)
                    else:
                        filtered_data["mac_addresses"] = ""
                
                elif col != "id":  # id zaten eklendi ve __all_ip_addrs ve __all_mac_addrs özel işlendi
                    # Eğer sütun nested bir yapıda ise
                    if col in flattened:
                        filtered_data[col] = flattened[col]
                    else:
                        # Sütun adını içeren herhangi bir alanı ara
                        matching_keys = [k for k in flattened.keys() if k.endswith(f"_{col}") or k.endswith(f".{col}")]
                        if matching_keys:
                            filtered_data[col] = flattened[matching_keys[0]]
                        else:
                            filtered_data[col] = None  # Eğer değer bulunamazsa None ekle
            
            flattened_data.append(filtered_data)

    if flattened_data:
        table_name = node_type.lower().replace(" ", "_")
        # Tablo oluşturulurken final_columns kullan (ipv4 ve ipv6 içeren)
        await create_table(connection, schema_name, table_name, final_columns)
        await insert_data_with_dynamic_columns(connection, schema_name, table_name, flattened_data)
        logger.info(f"{node_type} table created with specified columns: {final_columns}")

    await verify_node_count(connection, schema_name, node_type, len(all_results))

async def verify_node_count(connection, schema_name, node_type, expected_count):
    table_name = node_type.lower().replace(" ", "_")
    query = f"SELECT COUNT(*) FROM {schema_name}.{table_name};"
    row = await connection.fetchrow(query)
    actual_count = row["count"]

    # Esnek doğrulama: Beklenenden daha fazla olması sorun değil
    # Müşteri ortamında daha fazla node olabilir
    if actual_count < expected_count:
        # Gerçek sayı beklenenden azsa uyarı ver
        logger.warning(f"Too few {node_type} found: Expected at least {expected_count}, Found={actual_count}")
    elif actual_count > expected_count:
        # Gerçek sayı beklenenden fazlaysa bilgi ver
        logger.info(f"More {node_type} than expected: Expected={expected_count}, Found={actual_count}")
    else:
        # Sayılar eşitse bilgi ver
        logger.info(f"Node count verified for {node_type}: {actual_count}")

###############################################################################
# MAIN
###############################################################################

async def main():
    logger.info("Starting data extraction and insertion process.")

    # Timeout ayarlarını güncelledik - daha uzun timeout
    timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT * 2)  # Timeout süresini 2 katına çıkar
    
    async with asyncpg.create_pool(**DB_CONFIG) as pool:
        async with pool.acquire() as connection:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                try:
                    # Node türlerini tanımla
                    node_types = [
                        "Host",
                        "VirtualMachine",
                        "SoftwareInstance"
                    ]
                    
                    # Her node türü için temel işlemleri yap
                    for node_type in node_types:
                        logger.info(f"Starting {node_type} table processing...")
                        await process_node_type(connection, DB_SCHEMA, node_type, session)
                        
                        # Host özel işlemleri sadece Host için yap
                        if node_type == "Host":
                            # Host tablosunun dolu olduğunu doğrula
                            verify_query = f"SELECT COUNT(*) FROM {DB_SCHEMA}.host;"
                            host_count = await connection.fetchval(verify_query)
                            logger.info(f"Host table populated with {host_count} records")
                            
                            if host_count == 0:
                                logger.error("Host table is empty! Stopping process.")
                                return
                            
                            # Host tablosuna uptime ve creation bilgilerini ekle
                            logger.info("Adding uptime and creation info to Host table...")
                            await update_host_uptime_creation(connection, DB_SCHEMA, session)
                    
                    # SoftwareInstance için publisher bilgisini sorgulamayı 3 kez deneyin
                    max_publisher_attempts = 3
                    for attempt in range(max_publisher_attempts):
                        try:
                            logger.info(f"Attempt {attempt+1}/{max_publisher_attempts}: Adding publisher info to SoftwareInstance table...")
                            await execute_custom_query_and_update(connection, DB_SCHEMA, session, "software_instance_publisher")
                            
                            # Publisher bilgilerini kontrol et
                            check_query = f"""
                            SELECT COUNT(*) as total,
                                   COUNT(CASE WHEN publisher IS NOT NULL AND publisher != '' THEN 1 END) as with_publisher
                            FROM {DB_SCHEMA}.softwareinstance;
                            """
                            check_result = await connection.fetchrow(check_query)
                            logger.info(f"Publisher update status: {check_result['with_publisher']}/{check_result['total']} records have publisher data")
                            
                            # Eğer yeterli publisher bilgisi elde edilirse, döngüden çık
                            if check_result['with_publisher'] > check_result['total'] * 0.5:  # En az %50'si
                                logger.info("Sufficient publisher data obtained, skipping further attempts")
                                break
                                
                            # Kısa bir bekleme ekle
                            await asyncio.sleep(5)
                        except Exception as e:
                            logger.error(f"Error in publisher update attempt {attempt+1}: {str(e)}")
                            await asyncio.sleep(10)  # Hata durumunda daha uzun bekle
                    
                    # Alternative publisher sorgusu - vendor bilgisi
                    try:
                        logger.info("Trying vendor data as publisher source...")
                        await execute_custom_query_and_update(connection, DB_SCHEMA, session, "software_instance_publisher_2")
                    except Exception as e:
                        logger.error(f"Error fetching vendor data: {str(e)}")
                    
                    # Vendor bilgilerini publisher'a kopyala (publisher null olanlar için)
                    try:
                        vendor_update_query = f"""
                        UPDATE {DB_SCHEMA}.softwareinstance 
                        SET publisher = 
                            CASE
                                WHEN vendor_name IS NOT NULL AND vendor_name != '' THEN vendor_name
                                ELSE publisher
                            END
                        WHERE (publisher IS NULL OR publisher = '');
                        """
                        await connection.execute(vendor_update_query)
                        logger.info("Updated missing publisher values using vendor information")
                    except Exception as e:
                        logger.error(f"Error updating publisher from vendor: {str(e)}")
                    
                    # Relationships tablosunu oluştur ve ilişkileri işle
                    logger.info("Starting relationships processing...")
                    await ensure_relationships_table_exists(connection, DB_SCHEMA)
                    
                    # Tüm node türleri için ilişkileri işle
                    for node_type in node_types:
                        # Tüm node ID'leri bir kerede al
                        all_results = await fetch_all_nodes(session, node_type)
                        node_ids = [result[0] for result in all_results]
                        
                        # Node türleri için global önbellek
                        node_kind_cache = {}
                        
                        # Node ID'leri chunk'lara böl ve paralel işle
                        chunk_size = 10  # Aynı anda işlenecek node sayısı
                        total_chunks = (len(node_ids) + chunk_size - 1) // chunk_size
                        
                        for i in range(0, len(node_ids), chunk_size):
                            chunk = node_ids[i:i + chunk_size]
                            current_chunk = (i // chunk_size) + 1
                            logger.info(f"Processing {node_type} chunk {current_chunk}/{total_chunks}")
                            
                            # Her chunk işlemi için ayrı bir bağlantı alacak şekilde düzenliyoruz
                            async def process_node_with_connection(node_id):
                                async with pool.acquire() as node_connection:
                                    await process_relationships(node_connection, node_id, session, node_kind_cache)
                            
                            tasks = [
                                process_node_with_connection(node_id)
                                for node_id in chunk
                            ]
                            await asyncio.gather(*tasks)
                            
                            # Her chunk sonrası relationships tablosunu kontrol et
                            rel_count = await connection.fetchval(
                                f"SELECT COUNT(*) FROM {DB_SCHEMA}.relationships;"
                            )
                            logger.info(f"Current relationships count: {rel_count}")

                    # Retired hostları işle
                    logger.info("Processing retired hosts...")
                    await process_retired_hosts(connection, session)
                    
                    # Son durumu kontrol et
                    final_check_query = f"""
                    SELECT COUNT(*) as total,
                           COUNT(CASE WHEN publisher IS NOT NULL AND publisher != '' THEN 1 END) as with_publisher
                    FROM {DB_SCHEMA}.softwareinstance;
                    """
                    final_check = await connection.fetchrow(final_check_query)
                    logger.info(f"FINAL Publisher status: {final_check['with_publisher']}/{final_check['total']} records have publisher data")

                except Exception as e:
                    logger.error(f"Error in main process: {str(e)}")
                    raise

    logger.info("All data processing completed successfully.")

if __name__ == "__main__":
    asyncio.run(main()) 
