import {Component, inject, OnInit} from '@angular/core';
import {StaffService} from "../../service/staff/staff.service";
import { Router } from '@angular/router';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  contaDaApprovare = 0;
  loadingDaApprovare = false;
  erroreDaApprovare = '';

  private router = inject(Router);
  private staffService: StaffService = inject(StaffService);


  ngOnInit(): void {
    this.loadContaDaApprovare();
  }

  loadContaDaApprovare(): void {
    this.loadingDaApprovare = true;
    this.erroreDaApprovare = '';

    this.staffService.getContaDaApprovare().subscribe({
      next: (count) => {
        this.contaDaApprovare = count ?? 0;
        this.loadingDaApprovare = false;
      },
      error: () => {
        this.erroreDaApprovare = 'Impossibile caricare il numero di persone da approvare.';
        this.loadingDaApprovare = false;
      }
    });
  }

  vaiADaApprovare(): void {
    this.router.navigate(['/backoffice/staff/approvare']);
  }
}
