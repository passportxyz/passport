const constructor = jest.fn();
const postMessage = jest.fn();
const close = jest.fn();

export class BroadcastChannel {
  constructor() {
    return constructor();
  }
  postMessage() {
    return postMessage();
  }
  close() {
    return close();
  }
}
