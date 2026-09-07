import { EventEmitter } from 'events';

class TestEventEmitter extends EventEmitter {}

export const testEmitter = new TestEventEmitter();
