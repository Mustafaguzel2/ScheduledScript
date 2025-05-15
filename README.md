# SBM

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## İçindekiler

- [Hakkında](#hakkında)
- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
  - [Gereksinimler](#gereksinimler)
  - [Kurulum Adımları](#kurulum-adımları)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [Environment Değişkenleri](#environment-değişkenleri)
- [API Uç Noktaları](#api-uç-noktaları)
- [Yetkilendirme ve Güvenlik](#yetkilendirme-ve-güvenlik)
- [Geliştirme ve En Iyi Uygulamalar](#geliştirme-ve-en-iyi-uygulamalar)
- [Katkı Sağlama](#katkı-sağlama)
- [Lisans](#lisans)
- [Teşekkürler](#teşekkürler)
- [Kod Mimarisi ve Kullanım Mantığı](#kod-mimarisi-ve-kullanım-mantığı)

---

## Hakkında

SBM, Next.js 13+ App Router, TypeScript (strict mode), React Query ve Tailwind CSS ile geliştirilmiş modern bir operasyon yönetim panelidir. LDAP/Active Directory entegrasyonu ile güvenli kullanıcı yönetimi, iş takibi, tablo yönetimi ve konfigürasyon işlemleri sunar.

---

## Özellikler

- **LDAP/AD ile Güvenli Giriş ve Yetkilendirme**
- **Gerçek Zamanlı Dashboard ve İzleme**
- **Kullanıcı Yönetimi (Admin/Normal Kullanıcı Ayrımı)**
- **Parametre ve Zamanlayıcı Konfigürasyonu**
- **Tablo Listeleme ve Detayları**
- **İş ve Log Yönetimi**
- **Responsive ve Modern Arayüz**
- **TypeScript Strict Mode**
- **React Query ile Veri Yönetimi**
- **Erişilebilirlik ve i18n Hazır**

---

## Kurulum

### Gereksinimler

- Node.js (v18+)
- npm, yarn, pnpm veya bun
- LDAP/Active Directory sunucusu

### Kurulum Adımları

1. **Projeyi Klonlayın**

```bash
git clone https://github.com/yourusername/sbm.git
cd SBM
```

2.**Bağımlılıkları Yükleyin**

```bash
npm install
# veya
yarn install
```

3.**Environment Dosyasını Oluşturun**

`.env.example` dosyasını kopyalayarak `.env.local` oluşturun ve gerekli değişkenleri doldurun.

---

## Kullanım

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
# veya
yarn dev
```

Uygulamayı [http://localhost:3000](http://localhost:3000) adresinde görüntüleyebilirsiniz.

---

## Proje Yapısı

```text
SBM/
├── src/
│   ├── app/
│   │   ├── (login)/           # Giriş sayfaları
│   │   ├── api/               # API route'ları
│   │   │   ├── auth/          # Giriş/Çıkış
│   │   │   ├── users/         # Kullanıcı yönetimi
│   │   │   ├── tables/        # Tablo yönetimi
│   │   │   ├── jobs/          # İş ve log yönetimi
│   │   ├── panel/             # Yönetim paneli
│   │   ├── components/        # React bileşenleri
│   │   ├── hooks/             # Custom React hook'ları
│   │   ├── lib/               # Yardımcı fonksiyonlar
│   │   └── types/             # TypeScript tip tanımları
├── logs/                      # Log dosyaları
├── data/                      # Veri dosyaları
├── .env.example               # Örnek environment dosyası
├── README.md                  # Bu dosya
```

---

## Environment Değişkenleri

`.env.local` dosyanızda aşağıdaki değişkenleri tanımlayın:

```env
# LDAP/AD Bağlantısı
LDAP_URL=ldap://your-ldap-server
LDAP_BASE_DN=DC=example,DC=com

# Service Account (Tüm kullanıcıları listelemek için)
LDAP_SERVICE_USER=service_account@domain.com
LDAP_SERVICE_PASS=service_account_password

# Girişte kontrol edilen gruplar
GROUP_NAME=Administrators
GROUP_NAME2=Pusula_Discovery

# (Opsiyonel) Next.js public değişkenleri
NEXT_PUBLIC_LDAP_URL=ldap://your-ldap-server
```

---

## API Uç Noktaları

### Authentication

- **POST `/api/auth/login`**  
  Kullanıcı giriş işlemi.  
  **Request:**  
  
  ```json
  { "username": "kullanici", "password": "sifre" }
  ```

  **Response:**  
  Session cookie ve kullanıcı yetkisi (admin mi?).

- **POST `/api/auth/logout`**  
  Oturumu sonlandırır.

### User Management

- **GET `/api/users/get-users`**  
  Tüm kullanıcıları ve gruplarını listeler.  
  - Tüm oturum açmış kullanıcılar erişebilir.
  - Response içinde `isAdmin` alanı ile kullanıcının admin olup olmadığı döner.

- **PATCH `/api/users/change-status`**  
  Kullanıcı hesabını aktif/pasif yapar.  
  - Sadece adminler erişebilir.
  - **Request:**  

    ```json
    { "userDn": "CN=User,OU=Users,DC=example,DC=com", "enabled": true }
    ```

### Table Management

- **GET `/api/tables/list`**: Tabloları listeler
- **GET `/api/tables/details`**: Tablo detaylarını getirir

### Job Logs

- **GET `/api/jobs/job-logs`**: İş loglarını getirir

### Scheduled Jobs

- **POST `/api/jobs/start-scheduled-job`**: Zamanlanmış işi başlatır

---

## Yetkilendirme ve Güvenlik

- **Girişte LDAP ile kimlik doğrulama yapılır.**
- **Session cookie'sinde şifre asla saklanmaz.**
- **Kullanıcı admin mi değil mi bilgisi session'da tutulur.**
- **Tüm kullanıcılar kullanıcı listesini görebilir, ancak sadece adminler kullanıcı üzerinde değişiklik yapabilir.**
- **Service account ile sadece okuma işlemleri yapılır, kullanıcı şifresiyle asla toplu sorgu yapılmaz.**
- **Kritik işlemler için backend'de admin kontrolü zorunludur.**
- **CSRF, XSS ve diğer güvenlik önlemleri Next.js ve HTTPOnly cookie ile sağlanır.**

---

## Geliştirme ve En Iyi Uygulamalar

- **TypeScript strict mode** zorunlu
- **React Query** ile veri yönetimi, cache, error/loading state
- **Next.js 13+ App Router** ile server/client ayrımı ve SEO
- **Kod bölme, lazy loading, memoization**
- **React Context ve local storage ile state yönetimi**
- **Güvenli input validation ve error handling**
- **Erişilebilirlik (ARIA, klavye navigasyonu, renk kontrastı)**
- **i18n ve RTL desteği için hazır altyapı**
- **Storybook ile component dokümantasyonu (önerilir)**
- **OpenAPI/Swagger ile API dokümantasyonu (önerilir)**

---

## Katkı Sağlama

1. Fork'layın
2. Yeni bir branch açın: `git checkout -b feature/ozellik`
3. Değişikliklerinizi commit'leyin: `git commit -m 'Özellik eklendi'`
4. Branch'i push'layın: `git push origin feature/ozellik`
5. Pull Request açın

---

## Lisans

MIT Lisansı ile dağıtılmaktadır. Detaylar için `LICENSE` dosyasına bakınız.

---

## Teşekkürler

- [Next.js](https://nextjs.org) ve [Tailwind CSS](https://tailwindcss.com) ekiplerine
- Modern operasyon yönetimi ihtiyacından ilham alınmıştır

---

## Kod Mimarisi ve Kullanım Mantığı

### 1. Genel Mimarî

- **Next.js 13+ App Router**:  Dosya tabanlı routing, server/client component ayrımı, API route'ları ve modern React özellikleri bir arada kullanılır.
- **TypeScript (Strict Mode)**:  Tüm kod tabanı TypeScript strict mode ile yazılmıştır. Tip güvenliği ve hata öncesi yakalama sağlar.
- **React Query**:  Veri çekme, cache, invalidation ve global loading/error state yönetimi için kullanılır.
- **Tailwind CSS**:  Hızlı ve tutarlı UI geliştirme için utility-first CSS yaklaşımı.

### 2. Klasör Yapısı ve Sorumluluklar

```text
src/
├── app/
│   ├── (login)/           # Giriş ve kimlik doğrulama sayfaları
│   ├── api/               # Sunucu tarafı API route'ları (Next.js)
│   │   ├── auth/          # Giriş/çıkış işlemleri
│   │   ├── users/         # Kullanıcı yönetimi (listeleme, durum değiştirme)
│   │   ├── tables/        # Tablo yönetimi
│   │   ├── jobs/          # İş ve log yönetimi
│   ├── panel/             # Yönetim paneli (dashboard, ayarlar, konfigüratör)
│   ├── components/        # Tüm React bileşenleri (UI, dashboard, ayarlar vs.)
│   ├── hooks/             # Custom React hook'ları
│   ├── lib/               # Yardımcı fonksiyonlar, util'ler
│   └── types/             # TypeScript tip tanımları
```

- Her API route'u (ör. `/api/users/get-users`) kendi dosyasında, Next.js serverless fonksiyonu olarak tanımlanır.
- Tüm business logic, mümkün olduğunca küçük ve test edilebilir fonksiyonlara bölünmüştür.

### 3. Kimlik Doğrulama ve Yetkilendirme

- **LDAP/Active Directory ile Giriş:**  Kullanıcılar, kurumun AD/LDAP sunucusuna kullanıcı adı ve şifre ile giriş yapar. Giriş başarılıysa, backend kullanıcıyı doğrular ve session cookie'si oluşturur.
- **Session Yönetimi:**  Kullanıcıya özel session cookie'si ile şifre asla saklanmaz. Kullanıcının admin olup olmadığı (isMember) session'da tutulur.
- **Yetkilendirme:**
  - Tüm oturum açmış kullanıcılar kullanıcı listesini görebilir.
  - Sadece adminler (isMember: true) kullanıcı üzerinde değişiklik (ör. durum değiştirme) yapabilir.
  - Backend'de kritik endpoint'lerde admin kontrolü zorunludur.

### 4. API Kullanım Mantığı

#### /api/auth/login

- Kullanıcıdan username ve password alınır.
- LDAP ile doğrulama yapılır.
- Kullanıcı session'ı oluşturulur, admin/grup üyeliği kontrol edilir.

#### /api/users/get-users

- Tüm oturum açmış kullanıcılar erişebilir.
- Kullanıcılar, bir "service account" ile LDAP'tan çekilir (kullanıcı şifresiyle toplu sorgu yapılmaz).
- Response içinde, oturum açan kullanıcının admin olup olmadığı bilgisi de döner.

#### /api/users/change-status

- Sadece adminler erişebilir.
- Kullanıcı hesabı etkin/pasif yapılabilir.
- Backend, session'dan admin kontrolü yapar.

### 5. React Query ile Veri Yönetimi

- Tüm veri çekme işlemleri (ör. kullanıcı listesi, tablo detayları) React Query ile yapılır.
- Her sorgunun kendine özgü bir query key'i vardır.
- Loading ve error state'leri her zaman gösterilir.
- Mutasyonlarda (ör. kullanıcı durumu değiştirme) cache invalidation ve optimistic update uygulanır.

### 6. UI ve Component Mimarisi

- `components/` altında, her panel/özellik için ayrı alt klasörler vardır (ör. dashboard, configurator, settings).
- Tüm UI elementleri (Button, Modal, Table vs.) tekrar kullanılabilir şekilde tasarlanır.
- Tailwind ile responsive ve erişilebilir (ARIA, klavye navigasyonu) tasarım önceliklidir.

### 7. Güvenlik ve Best Practice'ler

- Şifreler asla client'a veya cookie'ye yazılmaz.
- Tüm kritik işlemler backend'de session ve admin kontrolü ile korunur.
- CSRF, XSS gibi saldırılara karşı Next.js'in default güvenlik önlemleri ve HTTPOnly cookie kullanılır.
- TypeScript strict mode ile tip güvenliği sağlanır.
- Kodda her zaman error boundary ve fallback UI'lar bulunur.

### 8. Geliştirici Deneyimi ve Testler

- Kodda bolca inline açıklama ve tip tanımı bulunur.
- Storybook ile component dokümantasyonu önerilir.
- API endpointleri için OpenAPI/Swagger dokümantasyonu önerilir.
- Unit, integration ve e2e test altyapısı için Jest/Testing Library ve Playwright/Cypress önerilir.

### 9. Özet Kullanım Akışı

1. Kullanıcı login olur → LDAP ile doğrulanır → session oluşur.
2. Kullanıcı panelde kullanıcı listesini görür (herkes görebilir).
3. Eğer admin ise, kullanıcı üzerinde değişiklik yapabilir.
4. Tüm veri çekme ve güncelleme işlemleri React Query ile yönetilir.
5. Tüm erişim ve yetki kontrolleri backend'de session üzerinden yapılır.

---
