"""
Performance Profiling Script
Measures endpoint latency, component performance, and identifies bottlenecks
Run this script to benchmark the ML service before and after optimizations
"""

import time
import json
import logging
from typing import Dict, List, Any
import numpy as np
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PerformanceProfiler:
    """Profiles endpoint latency and component performance"""
    
    def __init__(self):
        self.results: Dict[str, List[float]] = {
            "fraud_assess": [],
            "fraud_assess_cached": [],
            "identity_verify_components": [],
        }
        self.component_times: Dict[str, List[float]] = {}
    
    def benchmark_fraud_assess(self, num_iterations: int = 100):
        """
        Benchmark fraud assessment endpoint
        Tests both fresh and cached requests
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"🧪 Benchmarking Fraud Assessment ({num_iterations} iterations)")
        logger.info(f"{'='*60}")
        
        # Import after to ensure models are loaded
        from endpoints.fraud_assess import FraudScoringEngine, FraudAssessRequest
        from utils.model_cache import ResponseCache
        
        # Sample fraud context
        sample_context = FraudAssessRequest(
            transaction_id="bench_txn_001",
            platform_user_id="bench_user_001",
            external_user_id="ext_bench_001",
            ip_address="197.210.84.1",
            ip_reputation_score=25,
            is_vpn=False,
            is_proxy=False,
            geolocation={"country": "NG", "city": "Lagos"},
            onboarding_location={"country": "NG", "city": "Lagos"},
            location_distance_km=0,
            impossible_travel=False,
            device_fingerprint="fp_abc123",
            device_seen_before=True,
            device_matches_onboarding=True,
            account_age_days=180,
            previous_transactions=15,
            transaction_amount=50000,
            time_since_last_tx_hrs=12,
            identity_verified=True,
            identity_match_score=94.2,
            liveness_passed=True,
            squad_payment_channel="card",
            squad_card_bin="539983",
        )
        
        # Benchmark fresh requests
        logger.info("\n📊 Fresh Requests (no cache):")
        fresh_times = []
        for i in range(num_iterations):
            # Clear cache and modify transaction_id to avoid hits
            if i % 10 == 0:
                ResponseCache.clear()
            
            sample_context.transaction_id = f"bench_txn_{i:04d}"
            
            start = time.perf_counter()
            result = FraudScoringEngine.calculate_score(sample_context)
            elapsed = (time.perf_counter() - start) * 1000
            fresh_times.append(elapsed)
            
            if i % 20 == 0:
                logger.info(f"  Iteration {i+1}: {elapsed:.2f}ms")
        
        self.results["fraud_assess"] = fresh_times
        
        # Benchmark cached requests
        logger.info("\n💾 Cached Requests (response cache):")
        cached_times = []
        sample_context.transaction_id = "bench_cached_001"
        
        for i in range(50):  # Fewer iterations since cache is near-instant
            start = time.perf_counter()
            result = FraudScoringEngine.calculate_score(sample_context)
            elapsed = (time.perf_counter() - start) * 1000
            cached_times.append(elapsed)
            
            if i % 10 == 0:
                logger.info(f"  Iteration {i+1}: {elapsed:.2f}ms")
        
        self.results["fraud_assess_cached"] = cached_times
        
        # Report statistics
        self._report_stats("Fresh Requests", fresh_times)
        self._report_stats("Cached Requests", cached_times)
        
        if fresh_times and cached_times:
            improvement = (np.mean(fresh_times) - np.mean(cached_times)) / np.mean(fresh_times) * 100
            logger.info(f"\n✅ Cache improvement: {improvement:.1f}% faster")
    
    def benchmark_model_initialization(self):
        """
        Benchmark model loading times
        Measures impact of model pre-loading on startup
        """
        logger.info(f"\n{'='*60}")
        logger.info("🔄 Benchmarking Model Initialization")
        logger.info(f"{'='*60}")
        
        from utils.model_cache import ModelCache
        
        # Clear existing cache
        cache = ModelCache()
        cache._models_loaded = False
        cache._deepface_model = None
        cache._mediapipe_face_detection = None
        cache._mediapipe_face_mesh = None
        
        logger.info("\n⏱️  Cold startup (loading all models):")
        start = time.perf_counter()
        ModelCache.initialize_models()
        elapsed = (time.perf_counter() - start) * 1000
        
        logger.info(f"✅ Total model initialization: {elapsed:.1f}ms")
        self.component_times["model_init"] = [elapsed]
        
        # Report if models are pre-loaded
        if ModelCache.is_initialized():
            logger.info("✓ Models are cached and ready for requests")
    
    def benchmark_ocr_pipeline(self):
        """
        Benchmark OCR and document field extraction
        Measures impact of adding document type detection
        """
        logger.info(f"\n{'='*60}")
        logger.info("📄 Benchmarking Document OCR Pipeline")
        logger.info(f"{'='*60}")
        
        try:
            import cv2
            import numpy as np
            from utils.document_ocr import detect_document_type, extract_document_fields
            
            # Create sample document image (simulate random document)
            sample_image = np.random.randint(0, 256, (600, 1000, 3), dtype=np.uint8)
            
            # Benchmark document type detection
            logger.info("\n🔍 Document Type Detection:")
            det_times = []
            for i in range(20):
                start = time.perf_counter()
                doc_type = detect_document_type(sample_image)
                elapsed = (time.perf_counter() - start) * 1000
                det_times.append(elapsed)
            
            self.component_times["document_detection"] = det_times
            self._report_stats("Document Type Detection", det_times)
            
            # Benchmark field extraction
            logger.info("\n📋 Field Extraction:")
            field_times = []
            for i in range(10):  # Fewer iterations, OCR is slower
                start = time.perf_counter()
                fields = extract_document_fields(sample_image, "drivers_license")
                elapsed = (time.perf_counter() - start) * 1000
                field_times.append(elapsed)
            
            self.component_times["field_extraction"] = field_times
            self._report_stats("Field Extraction", field_times)
            
        except Exception as e:
            logger.warning(f"⚠️  OCR benchmark skipped: {e}")
    
    def _report_stats(self, label: str, times: List[float]):
        """Generate and log statistics for a benchmark"""
        if not times:
            return
        
        times_array = np.array(times)
        stats = {
            "count": len(times),
            "mean": np.mean(times_array),
            "median": np.median(times_array),
            "stdev": np.std(times_array),
            "min": np.min(times_array),
            "max": np.max(times_array),
            "p50": np.percentile(times_array, 50),
            "p95": np.percentile(times_array, 95),
            "p99": np.percentile(times_array, 99),
        }
        
        logger.info(f"\n📈 {label}:")
        logger.info(f"  Count:  {stats['count']}")
        logger.info(f"  Mean:   {stats['mean']:.2f}ms")
        logger.info(f"  Median: {stats['median']:.2f}ms")
        logger.info(f"  StDev:  {stats['stdev']:.2f}ms")
        logger.info(f"  Min:    {stats['min']:.2f}ms")
        logger.info(f"  Max:    {stats['max']:.2f}ms")
        logger.info(f"  P50:    {stats['p50']:.2f}ms")
        logger.info(f"  P95:    {stats['p95']:.2f}ms")
        logger.info(f"  P99:    {stats['p99']:.2f}ms")
        
        return stats
    
    def generate_report(self, output_file: str = "performance_report.json"):
        """Generate comprehensive performance report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "benchmarks": self.results,
            "component_times": self.component_times,
            "targets": {
                "fraud_assess_ms": "< 100ms",
                "identity_verify_ms": "< 500ms",
            }
        }
        
        # Analyze target compliance
        if self.results.get("fraud_assess"):
            fraud_mean = np.mean(self.results["fraud_assess"])
            compliance = "✅" if fraud_mean < 100 else "❌"
            logger.info(f"\n🎯 Target Compliance:")
            logger.info(f"  {compliance} Fraud Assess: {fraud_mean:.2f}ms (target: <100ms)")
        
        # Save report
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"\n💾 Report saved to: {output_file}")
        return report


def main():
    """Run comprehensive performance benchmarks"""
    logger.info("\n" + "="*60)
    logger.info("🚀 TrustLayer ML Service - Performance Profiler")
    logger.info("="*60)
    
    profiler = PerformanceProfiler()
    
    # Run benchmarks
    profiler.benchmark_model_initialization()
    profiler.benchmark_fraud_assess(num_iterations=100)
    profiler.benchmark_ocr_pipeline()
    
    # Generate report
    profiler.generate_report()
    
    logger.info("\n" + "="*60)
    logger.info("✅ Performance profiling complete!")
    logger.info("="*60)


if __name__ == "__main__":
    main()
