import { Component, inject, OnInit, signal } from '@angular/core';
import { ThiingsGridComponent } from './thiingsGrid';
import { FormsModule } from '@angular/forms';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Gallery } from './gallery';

import { Pane } from 'tweakpane';

@Component({
  selector: 'app-root',
  imports: [ThiingsGridComponent, FormsModule, NzModalModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('thiings.co');
  private readonly modal = inject(NzModalService);

  public gridSize = 100;

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

  ngOnInit(): void {
    const pane = new Pane() as any;
    pane.addBinding(this, 'gridSize', { min: 50, max: 200, step: 1, label: 'Image size' });
  }

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
