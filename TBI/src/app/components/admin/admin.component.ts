import { Component, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements AfterViewInit {

  // --- Chart Data ---
  monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  monthlyData = [210, 250, 300, 350, 280, 320, 380, 400, 330, 370, 410, 450];
  
  yearlyLabels: string[] = [];
  yearlyData: number[] = [];
  
  monthlySalesChart: any;

  constructor() {
    const currentYear = new Date().getFullYear();
    // Generate labels and random data from 2024 to the current year
    for (let year = 2024; year <= currentYear; year++) {
        this.yearlyLabels.push(year.toString());
        // Generating random data for demonstration purposes
        this.yearlyData.push(Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000);
    }
  }

  ngAfterViewInit(): void {
    this.createChart();
    // Setup dropdown for "User Sign In" chart
    this.setupDropdown('userSignInOptionsButton', 'userSignInOptionsDropdown', this.monthlySalesChart);
    // Setup dropdown for "Monthly Target" (no chart attached)
    this.setupDropdown('monthlyTargetOptionsButton', 'monthlyTargetOptionsDropdown', null);

    // Close all dropdowns when clicking anywhere else on the page
    window.addEventListener('click', () => {
      document.querySelectorAll('.absolute.right-0.mt-2').forEach(dropdown => {
        dropdown.classList.add('hidden');
      });
    });
  }

  createChart(): void {
    const canvas = document.getElementById('monthlySalesChart') as HTMLCanvasElement;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            this.monthlySalesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: this.monthlyLabels, // Initial view is monthly
                    datasets: [{
                        label: 'Sign Ins',
                        data: this.monthlyData, // Initial data is monthly
                        backgroundColor: 'rgba(110, 17, 176, 0.8)',
                        borderColor: 'rgba(110, 17, 176, 1)',
                        borderWidth: 1,
                        borderRadius: 8,
                        barPercentage: 0.5,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                // drawBorder: false, // FIX: This property does not exist in Chart.js v3+
                            },
                            ticks: {
                                stepSize: 100 // Initial step size for monthly
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                            }
                        }
                    }
                }
            });
        }
    }
  }

  // --- Dropdown & Chart Update Logic ---
  setupDropdown(buttonId: string, dropdownId: string, chartInstance: Chart | null): void {
    const button = document.getElementById(buttonId);
    const dropdown = document.getElementById(dropdownId);

    if (!button || !dropdown) return;

    button.addEventListener('click', (event) => {
        event.stopPropagation();
        // Hide other open dropdowns before showing the new one
        document.querySelectorAll('.absolute.right-0.mt-2').forEach(d => {
            if (d.id !== dropdownId) {
                d.classList.add('hidden');
            }
        });
        dropdown.classList.toggle('hidden');
    });

    // If a chart is associated with this dropdown, add update logic
    if (chartInstance) {
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target as HTMLAnchorElement;
            if (target.tagName === 'A') {
                const period = target.dataset['period'];
                // FIX: Access scales with bracket notation and handle potential undefined values.
                const yAxis = chartInstance.options.scales?.['y'];

                if (period === 'yearly') {
                    chartInstance.data.labels = this.yearlyLabels;
                    chartInstance.data.datasets[0].data = this.yearlyData;
                    if (yAxis?.ticks) {
                        // FIX: Cast to 'any' to bypass complex type error for stepSize
                        (yAxis.ticks as any).stepSize = 1000;
                    }
                } else if (period === 'monthly') {
                    chartInstance.data.labels = this.monthlyLabels;
                    chartInstance.data.datasets[0].data = this.monthlyData;
                    if (yAxis?.ticks) {
                       (yAxis.ticks as any).stepSize = 100;
                    }
                }
                chartInstance.update();
                dropdown.classList.add('hidden');
            }
        });
    }
  }
}

