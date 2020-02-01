export function waitPromise(result, mills) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(result), mills);
    });
}