import { FormControl, FormGroup } from '@angular/forms';
import dayjs from 'dayjs';

export function updateApiFormErrors(formGroup: FormGroup, errorResponse: any) {
    if (errorResponse) {
        for (const field in errorResponse) {
            if (errorResponse.hasOwnProperty(field)) {
                const control = formGroup.get(field);
                if (control) {
                    control.setErrors({ serverError: errorResponse[field] });
                }
            }
        }
    }
}
export function getFormControlErrorMessages(
    form: FormGroup,
    customErrorMessages?: any
): {
    [key: string]: string | null;
} {
    const errorMessages: { [key: string]: string | null } = {};
    Object.entries(form.controls).forEach(([key, control]) => {
        if (control instanceof FormControl) {
            const itemError =
                customErrorMessages && customErrorMessages[key]
                    ? customErrorMessages[key]
                    : null;
            errorMessages[key] = getErrorMessageForControl(control, itemError);
        }
    });
    return errorMessages;
}
/**
 * Hàm lấy message lỗi khi validate form control
 * @param control
 * @param customErrorMessages
 * @returns
 */
export function getErrorMessageForControl(
    control: FormControl,
    customErrorMessages?: any
): string | null {
    if (!control.errors) return null;
    const errorKey = Object.keys(control.errors)[0];
    if (customErrorMessages && customErrorMessages[errorKey]) {
        return customErrorMessages[errorKey];
    }
    switch (errorKey) {
        case 'required':
            return 'Vui lòng không để trống.';
        case 'minlength':
            return `Vui lòng nhập tối thiểu ${control.errors?.['minlength'].requiredLength} kí tự`;
        case 'maxlength':
            return `Vui lòng nhập tối đa ${control.errors?.['maxlength'].requiredLength} kí tự`;
        case 'min':
            return `Vui lòng nhập số lớn hơn hoặc bằng ${control.errors?.['min'].min}`;
        case 'max':
            return `Vui lòng nhập số nhỏ hơn hoặc bằng ${control.errors?.['max'].max}`;
        case 'pattern':
            return 'Vui lòng nhập đúng định dạng';
        case 'email':
            return 'Vui lòng nhập đúng định dang email.';
        default:
            return null;
    }
}

export function elementFormControl(
    form: FormGroup,
    elementName: string
): FormControl {
    return form.get(elementName) as FormControl;
}
export function resetErrorMessages(errorMessages: any) {
    Object.keys(errorMessages).forEach((field) => {
        errorMessages[field] = '';
    });
    return errorMessages;
}

/**
 * Convert buffer to arrayBuffer
 * @param buffer
 * @returns
 */
export const toArrayBuffer = (buffer: Buffer) => {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
};
/**
 * Hiển thị thời gian của notification
 * @param notiTime
 */
export function getNotiTimeTitle(notiTime: any) {
    if (!notiTime) return null;
    if (!dayjs(notiTime).isValid) return;
    const now = dayjs();
    const notificationTime = dayjs(notiTime);
    const differenceInMinutes = now.diff(notificationTime, 'minute');
    // Nếu không phải cùng ngày
    if (!now.isSame(notificationTime, 'day')) {
        return notificationTime.format('HH:mm DD/MM/YYYY');
    }
    // Nếu cùng ngày
    if (differenceInMinutes < 1) {
        return 'Vừa xong';
    } else if (differenceInMinutes < 60) {
        return `${differenceInMinutes} phút trước`;
    } else {
        return notificationTime.format('HH:mm');
    }
}
/**
 * Hiển thị thời gian của tin nhắn
 * @param messageTime
 */
export function getMessageTime(messageTime: any) {
    if (!messageTime) return null;
    if (!dayjs(messageTime).isValid) return;
    const now = dayjs();
    const notificationTime = dayjs(messageTime);
    // Nếu không phải cùng ngày
    if (!now.isSame(messageTime, 'day')) {
        return notificationTime.format('DD/MM/YYYY');
        // const differenceInDays = now.diff(notificationTime, 'day');
        // if (differenceInDays < 8) {
        //     return `${differenceInDays} ngày`;
        // }
        // const differenceInWeeks = now.diff(notificationTime, 'w');
        // if (differenceInWeeks <= 4) {
        //     return `${differenceInWeeks} tuần`;
        // }
        // const differenceInMonths = now.diff(notificationTime, 'month');
        // if (differenceInMonths <= 12) {
        //     return `${differenceInMonths} tháng`;
        // }
        // const differenceInYears = now.diff(notificationTime, 'year');
        // return `${differenceInYears} năm`;
    } else {
        // Nếu cùng ngày
        return notificationTime.format('HH:mm');
    }
}

export const toLowerCaseNonAccentVietnamese = (str: string) => {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
    return str;
};

