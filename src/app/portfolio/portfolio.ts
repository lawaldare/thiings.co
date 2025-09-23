import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThiingsGridComponent } from '../thiingsGrid';
import { Five } from '../five/five';
import { Four } from '../four/four';
import { One } from '../one/one';
import { Three } from '../three/three';
import { Two } from '../two/two';

@Component({
  selector: 'app-portfolio',
  imports: [ThiingsGridComponent, FormsModule, CommonModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class Portfolio {
  public gridSize = 800;
  public readonly components = [One, Two, Three, Four, Five];
}
