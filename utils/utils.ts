export function isServerMode() {
    return typeof window === 'undefined'
}
export function uuidV4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
export function createShortId(){
    return uuidV4().slice(0, 4);
}

export function denounce(fn: (...args: any[]) => void, delay: number) {
    let timer: any;
    return function (...args: any[]) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}