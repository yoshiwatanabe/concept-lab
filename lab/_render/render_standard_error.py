import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
out = Path('public/img/standard-error')
out.mkdir(parents=True, exist_ok=True)
# Cell 3: standard error by sample size for two standard deviations.
mean = 70
std_A = 5
std_B = 15
sample_sizes = np.array([30, 50, 100, 200, 500])
se_A = std_A / np.sqrt(sample_sizes)
se_B = std_B / np.sqrt(sample_sizes)
plt.figure(figsize=(10, 6))
plt.plot(sample_sizes, se_A, marker='o', linestyle='-', label='Population A (Std Dev=5)')
plt.plot(sample_sizes, se_B, marker='x', linestyle='-', label='Population B (Std Dev=15)')
plt.xlabel('Sample Size')
plt.ylabel('Standard Error')
plt.title('Relationship between Sample Size and Standard Error')
plt.grid(True)
plt.legend()
plt.tight_layout()
plt.savefig(out/'05-se-by-sample-size.png', dpi=160)
plt.close()
# Cell 5: confidence intervals / whiskers for same mean and sample size.
sample_size = 50
se_A = std_A / np.sqrt(sample_size)
se_B = std_B / np.sqrt(sample_size)
confidence_interval_A = (mean - 1.96 * se_A, mean + 1.96 * se_A)
confidence_interval_B = (mean - 1.96 * se_B, mean + 1.96 * se_B)
print(f"95% Confidence Interval for Population A: {confidence_interval_A}")
print(f"95% Confidence Interval for Population B: {confidence_interval_B}")
plt.figure(figsize=(8, 5))
plt.errorbar(1, mean, yerr=1.96 * se_A, fmt='o', label='Population A', capsize=5)
plt.errorbar(2, mean, yerr=1.96 * se_B, fmt='o', label='Population B', capsize=5)
plt.xlim(0, 3)
plt.ylabel('Mean')
plt.xticks([1, 2], ['Population A', 'Population B'])
plt.title('Comparison of 95% Confidence Intervals')
plt.legend()
plt.grid(True, axis='y')
plt.tight_layout()
plt.savefig(out/'07-confidence-interval-comparison.png', dpi=160)
plt.close()
