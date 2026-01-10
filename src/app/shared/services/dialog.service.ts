import { Injectable, inject } from '@angular/core';
import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { Observable, Subject } from 'rxjs';

export interface DialogOptions {
  header?: string;
  width?: string;
  height?: string;
  closable?: boolean;
  modal?: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AppDialogService {
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);

  /**
   * Opens a dynamic dialog with the specified component
   */
  open<T>(component: any, options: DialogOptions = {}): DynamicDialogRef<T> {
    const config: DynamicDialogConfig = {
      header: options.header || '',
      width: options.width || '500px',
      height: options.height,
      closable: options.closable ?? true,
      modal: options.modal ?? true,
      data: options.data,
      dismissableMask: true,
      styleClass: 'app-dialog',
    };

    return this.dialogService.open(component, config) as DynamicDialogRef<T>;
  }

  /**
   * Opens a confirmation dialog
   */
  confirm(options: {
    title?: string;
    message: string;
    acceptLabel?: string;
    rejectLabel?: string;
    icon?: string;
    severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
  }): Observable<boolean> {
    const result = new Subject<boolean>();

    this.confirmationService.confirm({
      header: options.title || 'Confirmation',
      message: options.message,
      icon: options.icon || 'pi pi-exclamation-triangle',
      acceptLabel: options.acceptLabel || 'Yes',
      rejectLabel: options.rejectLabel || 'No',
      acceptButtonStyleClass: options.severity === 'danger' ? 'p-button-danger' : '',
      accept: () => {
        result.next(true);
        result.complete();
      },
      reject: () => {
        result.next(false);
        result.complete();
      },
    });

    return result.asObservable();
  }
}
