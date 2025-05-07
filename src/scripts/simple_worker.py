#!/usr/bin/env python3
"""
Simplified worker script for testing the scheduled job system.
This script simulates the worker.py functionality but with minimal external dependencies.
"""

import sys
import time
import random
import argparse
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser(description="Simple worker for testing scheduled jobs")
    parser.add_argument('--db-host', default='localhost', help='Database host')
    parser.add_argument('--db-name', default='testdb', help='Database name')
    parser.add_argument('--fail', action='store_true', help='Simulate a failure')
    parser.add_argument('--duration', type=int, default=10, help='Simulated job duration in seconds')
    return parser.parse_args()

def simulate_data_extraction(args):
    """Simulate the data extraction process with progress updates"""
    print(f"🔄 Connecting to database {args.db_name} on {args.db_host}...")
    time.sleep(1)
    
    if args.fail and random.random() < 0.3:
        print("❌ Failed to connect to database!")
        return False
    
    print(f"✅ Connected successfully to database")
    
    # Simulate processing different node types
    node_types = ["Host", "VirtualMachine", "SoftwareInstance"]
    
    for i, node_type in enumerate(node_types):
        print(f"📊 Processing {node_type} data ({i+1}/{len(node_types)})")
        
        # Simulate fetching records
        record_count = random.randint(50, 500)
        print(f"   - Found {record_count} {node_type} records")
        
        # Simulate processing with progress updates
        steps = min(args.duration // len(node_types), 5)
        for step in range(steps):
            time.sleep(1)
            progress = (step + 1) / steps * 100
            print(f"      - {progress:.0f}% complete")
            
            # Simulate random failure
            if args.fail and random.random() < 0.05:
                print(f"❌ Error processing {node_type} at step {step+1}!")
                return False
    
    # Simulate relationship processing
    if random.random() > 0.2:
        print(f"🔄 Processing relationships...")
        time.sleep(2)
        rel_count = random.randint(100, 1000)
        print(f"✅ Processed {rel_count} relationships")
    
    return True

def main():
    args = parse_args()
    start_time = datetime.now()
    
    print(f"🚀 Simple worker started at {start_time.isoformat()}")
    print(f"⚙️  Configuration:")
    print(f"   - DB Host: {args.db_host}")
    print(f"   - DB Name: {args.db_name}")
    print(f"   - Duration: {args.duration} seconds")
    print(f"   - Fail mode: {'enabled' if args.fail else 'disabled'}")
    
    success = simulate_data_extraction(args)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"⏱️  Job completed in {duration:.2f} seconds")
    
    if success:
        print("✅ Worker completed successfully!")
        return 0
    else:
        print("❌ Worker failed!")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("Worker interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"Unhandled exception in worker: {str(e)}")
        sys.exit(1) 