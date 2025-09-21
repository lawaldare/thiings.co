import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThiingsGridComponent } from './thiingsGrid';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { FormsModule } from '@angular/forms';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Gallery } from './gallery';

@Component({
  selector: 'app-root',
  imports: [ThiingsGridComponent, FormsModule, NzSliderModule, NzModalModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('thiings.co');
  private readonly modal = inject(NzModalService);

  public gridSize = signal(100);

  public olamides = [
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

  public onCellClick(item: any, pic: any): void {
    // console.log(item, pic);

    this.modal.create({
      nzTitle: `Infinite Scroll Gallery`,
      nzContent: Gallery,
      nzClosable: false,
      nzCentered: true,
      nzOkText: null,
      nzData: pic,
    });
  }

  onChange(value: number): void {
    console.log(`onChange: ${value}`);
  }
}
