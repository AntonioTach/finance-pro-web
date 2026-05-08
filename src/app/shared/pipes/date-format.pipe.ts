import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, formatStr: string = 'MMM dd, yyyy'): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string'
      ? new Date(value.substring(0, 10) + 'T00:00:00')
      : value;
    return format(date, formatStr);
  }
}

