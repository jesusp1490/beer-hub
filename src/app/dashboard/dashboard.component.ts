import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatDividerModule } from "@angular/material/divider";
import { RouterModule } from "@angular/router";
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js/auto';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { BeerService } from "../services/beer.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule,
    RouterModule,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('activityChart') activityChartRef!: ElementRef;
  @ViewChild('beerTypesChart') beerTypesChartRef!: ElementRef;

  userProfile = {
    photoURL: '/assets/default-avatar.png',
    username: 'username',
    fullName: 'Full Name',
    email: 'email@example.com',
    country: 'country',
    dob: '1990-01-01',
    joinedDate: '2024-01-01',
    rank: {
      name: 'Rank name',
      level: 1,
      progress: 65,
      pointsToNext: 100
    }
  };

  stats = {
    totalBeers: 150,
    totalCountries: 25,
    beerTypes: 42
  };

  achievements = [
    {
      name: 'Beer Explorer',
      description: 'Rate 100 different beers',
      unlockedDate: '2024-01-15',
      icon: '🍺'
    },
    {
      name: 'World Traveler',
      description: 'Try beers from 10 different countries',
      unlockedDate: '2024-02-01',
      icon: '🌍'
    },
    {
      name: 'Hop Master',
      description: 'Rate 50 different IPAs',
      unlockedDate: '2024-02-15',
      icon: '🌿'
    },
    {
      name: 'Brewery Friend',
      description: 'Visit 20 different breweries',
      unlockedDate: '2024-03-01',
      icon: '🏭'
    }
  ];

  private unsubscribe$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private beerService: BeerService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.createActivityChart();
    this.createBeerTypesChart();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private loadDashboardData(): void {
    // Implementation remains the same
  }

  private createActivityChart(): void {
    const ctx = this.activityChartRef.nativeElement.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Beers Rated',
            data: [45, 100, 35, 100, 50, 150],
            backgroundColor: '#2196f3',
          },
          {
            label: 'Total Transaction',
            data: [2000, 4000, 2500, 6000, 4500, 7000],
            backgroundColor: '#ff9800',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        }
      }
    });
  }

  private createBeerTypesChart(): void {
    const ctx = this.beerTypesChartRef.nativeElement.getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Lager', 'IPA', 'Stout', 'Pilsner', 'Wheat', 'Porter', 'Ale', 'Other'],
        datasets: [{
          data: [30, 25, 15, 10, 8, 7, 3, 2],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF99CC',
            '#C9CBCF'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        }
      }
    });
  }

  onEditField(field: string): void {
    console.log(`Editing field: ${field}`);
    // Implement edit functionality
  }

  onChangePassword(): void {
    console.log('Changing password');
    // Implement password change
  }

  onRequestNewBeer(): void {
    console.log('Requesting new beer');
    // Implement new beer request
  }

  onLogout(): void {
    this.authService.signOut();
  }
}