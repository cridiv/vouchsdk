"""
Load Testing Script
Measures endpoint performance under concurrent load
Tests latency percentiles, throughput, and identifies bottlenecks
"""

import time
import json
import logging
import asyncio
from typing import Dict, List, Any
from datetime import datetime
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LoadTester:
    """Load tests ML service endpoints"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.environ.get("VOUCH_API_URL", "https://vouchsdk.onrender.com")
        self.results = {
            "fraud_assess_concurrent": [],
            "fraud_assess_sequential": [],
        }
    
    def test_fraud_assess_load(self, 
                              concurrent_users: int = 10,
                              requests_per_user: int = 10):
        """
        Load test fraud assessment endpoint
        Simulates multiple concurrent users making requests
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"⚡ Load Testing Fraud Assess")
        logger.info(f"Concurrent Users: {concurrent_users}")
        logger.info(f"Requests per User: {requests_per_user}")
        logger.info(f"Total Requests: {concurrent_users * requests_per_user}")
        logger.info(f"{'='*60}")
        
        # Import endpoint directly
        from endpoints.fraud_assess import FraudScoringEngine, FraudAssessRequest
        
        # Sample contexts with variations
        base_context = {
            "platform_user_id": "load_test_user",
            "external_user_id": "ext_load_test",
            "ip_address": "197.210.84.1",
            "ip_reputation_score": 25,
            "is_vpn": False,
            "is_proxy": False,
            "geolocation": {"country": "NG", "city": "Lagos"},
            "onboarding_location": {"country": "NG", "city": "Lagos"},
            "location_distance_km": 0,
            "impossible_travel": False,
            "device_fingerprint": "fp_load_test",
            "device_seen_before": True,
            "device_matches_onboarding": True,
            "account_age_days": 180,
            "previous_transactions": 15,
            "transaction_amount": 50000,
            "time_since_last_tx_hrs": 12,
            "identity_verified": True,
            "identity_match_score": 94.2,
            "liveness_passed": True,
            "squad_payment_channel": "card",
            "squad_card_bin": "539983",
        }
        
        # Sequential test (baseline)
        logger.info("\n📊 Sequential Test (baseline):")
        sequential_times = []
        start_total = time.perf_counter()
        
        for req_num in range(concurrent_users * requests_per_user):
            context_dict = base_context.copy()
            context_dict["transaction_id"] = f"load_seq_{req_num:05d}"
            context = FraudAssessRequest(**context_dict)
            
            start = time.perf_counter()
            result = FraudScoringEngine.calculate_score(context)
            elapsed = (time.perf_counter() - start) * 1000
            sequential_times.append(elapsed)
            
            if (req_num + 1) % (concurrent_users * requests_per_user // 5) == 0:
                logger.info(f"  Progress: {req_num + 1}/{concurrent_users * requests_per_user}")
        
        seq_total_time = (time.perf_counter() - start_total)
        seq_throughput = (concurrent_users * requests_per_user) / seq_total_time
        self.results["fraud_assess_sequential"] = sequential_times
        
        logger.info(f"✅ Sequential Results:")
        logger.info(f"  Total Time: {seq_total_time:.2f}s")
        logger.info(f"  Throughput: {seq_throughput:.1f} req/s")
        self._report_latency_stats("Sequential", sequential_times)
        
        # Concurrent test
        logger.info("\n⚡ Concurrent Test (simultaneous users):")
        concurrent_times = []
        start_total = time.perf_counter()
        
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = []
            
            # Submit all requests
            for user_id in range(concurrent_users):
                for req_num in range(requests_per_user):
                    context_dict = base_context.copy()
                    context_dict["transaction_id"] = f"load_conc_u{user_id}_r{req_num:03d}"
                    context_dict["platform_user_id"] = f"load_user_{user_id}"
                    context = FraudAssessRequest(**context_dict)
                    
                    future = executor.submit(self._time_fraud_assess, context)
                    futures.append(future)
            
            # Collect results
            completed = 0
            for future in as_completed(futures):
                try:
                    elapsed = future.result()
                    concurrent_times.append(elapsed)
                    completed += 1
                    
                    if completed % (concurrent_users * requests_per_user // 5) == 0:
                        logger.info(f"  Progress: {completed}/{concurrent_users * requests_per_user}")
                except Exception as e:
                    logger.error(f"Request failed: {e}")
        
        conc_total_time = (time.perf_counter() - start_total)
        conc_throughput = (concurrent_users * requests_per_user) / conc_total_time
        self.results["fraud_assess_concurrent"] = concurrent_times
        
        logger.info(f"✅ Concurrent Results:")
        logger.info(f"  Total Time: {conc_total_time:.2f}s")
        logger.info(f"  Throughput: {conc_throughput:.1f} req/s")
        self._report_latency_stats("Concurrent", concurrent_times)
        
        # Compare
        speedup = seq_total_time / conc_total_time
        improvement = conc_throughput / seq_throughput
        
        logger.info(f"\n📈 Performance Comparison:")
        logger.info(f"  Sequential Throughput:  {seq_throughput:.1f} req/s")
        logger.info(f"  Concurrent Throughput:  {conc_throughput:.1f} req/s")
        logger.info(f"  Speedup: {speedup:.2f}x")
        logger.info(f"  Throughput Improvement: {improvement:.2f}x")
    
    def _time_fraud_assess(self, context) -> float:
        """Time a single fraud assess request"""
        from endpoints.fraud_assess import FraudScoringEngine
        
        start = time.perf_counter()
        result = FraudScoringEngine.calculate_score(context)
        return (time.perf_counter() - start) * 1000
    
    def _report_latency_stats(self, label: str, times: List[float]):
        """Report latency statistics"""
        if not times:
            return
        
        times_array = np.array(times)
        
        logger.info(f"\n⏱️  Latency Statistics - {label}:")
        logger.info(f"  Count:  {len(times)}")
        logger.info(f"  Mean:   {np.mean(times_array):.2f}ms")
        logger.info(f"  Median: {np.median(times_array):.2f}ms")
        logger.info(f"  Min:    {np.min(times_array):.2f}ms")
        logger.info(f"  Max:    {np.max(times_array):.2f}ms")
        logger.info(f"  P50:    {np.percentile(times_array, 50):.2f}ms")
        logger.info(f"  P90:    {np.percentile(times_array, 90):.2f}ms")
        logger.info(f"  P95:    {np.percentile(times_array, 95):.2f}ms")
        logger.info(f"  P99:    {np.percentile(times_array, 99):.2f}ms")
    
    def generate_report(self, output_file: str = "load_test_report.json"):
        """Generate load test report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "results": self.results,
        }
        
        # Analyze results
        if self.results.get("fraud_assess_sequential"):
            seq_times = np.array(self.results["fraud_assess_sequential"])
            report["sequential_stats"] = {
                "mean": float(np.mean(seq_times)),
                "p95": float(np.percentile(seq_times, 95)),
                "p99": float(np.percentile(seq_times, 99)),
            }
        
        if self.results.get("fraud_assess_concurrent"):
            conc_times = np.array(self.results["fraud_assess_concurrent"])
            report["concurrent_stats"] = {
                "mean": float(np.mean(conc_times)),
                "p95": float(np.percentile(conc_times, 95)),
                "p99": float(np.percentile(conc_times, 99)),
            }
        
        # Save report
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"\n💾 Load test report saved to: {output_file}")
        return report


def main():
    """Run load tests"""
    logger.info("\n" + "="*60)
    logger.info("🚀 Load Test - TrustLayer ML Service")
    logger.info("="*60)
    
    tester = LoadTester()
    
    # Run concurrent load test
    tester.test_fraud_assess_load(
        concurrent_users=10,
        requests_per_user=20
    )
    
    # Generate report
    tester.generate_report()
    
    logger.info("\n" + "="*60)
    logger.info("✅ Load testing complete!")
    logger.info("="*60)


if __name__ == "__main__":
    main()
