import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Five } from './five';

describe('Five', () => {
  let component: Five;
  let fixture: ComponentFixture<Five>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Five]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Five);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
