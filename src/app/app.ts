import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThiingsGridComponent } from './thiingsGrid';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThiingsGridComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('thiings.co');

  colors = [
    'red',
    'green',
    'blue',
    'yellow',
    'pink',
    'cyan',
    'orange',
    'purple',
    'teal',
    'lime',
    'indigo',
    'amber',
    'brown',
  ];

  olamides = [
    '1.jpeg',
    '2.jpeg',
    '3.jpeg',
    '4.jpeg',
    '5.jpeg',
    '6.jpeg',
    '7.jpeg',
    '8.jpeg',
    '9.jpeg',
    '10.jpeg',
    '11.jpeg',
    '12.jpeg',
    '13.jpeg',
    '14.jpeg',
    '15.jpeg',
    '16.jpeg',
    '17.jpeg',
    '18.jpeg',
    '19.jpeg',
    '20.jpeg',
    '21.jpeg',
    '22.jpeg',
    '23.jpeg',
    '24.jpeg',
  ];

  onCellClick(item: any) {
    // alert(`Cell ${item.gridIndex} clicked!`);
  }
}
