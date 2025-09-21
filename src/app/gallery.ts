import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: ` <img [src]="imagePath" alt="Olamide Image" style="width: 100%; height: auto;" />`,
  styles: [``],
})
export class Gallery {
  readonly picPath = inject(NZ_MODAL_DATA);

  get imagePath() {
    return `assets/olamide/${this.picPath}`;
  }
}
