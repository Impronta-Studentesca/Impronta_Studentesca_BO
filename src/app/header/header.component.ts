import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../service/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf, AsyncPipe, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private elRef = inject(ElementRef<HTMLElement>);
  private sub?: Subscription;

  menuOpen = false;

  // Stato auth reattivo
  user$ = this.auth.currentUser$;       // LoginResponseDTO | null
  isLoggedIn$ = this.auth.isLoggedIn$;  // boolean

  ngOnInit(): void {
    // Chiudi menu ad ogni cambio route
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  onNavItemClick(): void {
    this.closeMenu();
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  /**
   * Chiudi il menu se clicchi FUORI dal componente header.
   * Così non si richiude subito quando clicchi il burger.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) return;

    const target = event.target as Node | null;
    const clickedInside = !!target && this.elRef.nativeElement.contains(target);

    if (!clickedInside) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen) this.closeMenu();
  }
}
