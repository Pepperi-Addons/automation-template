// performance manager helps with performance measurements.
// there are two main functions:
// startMeasure - starts a performance measurement
// stopMeasure - stops a performance measurement
// each function has a name parameter, which is the name of the measurement. startMeasure optionally has a description parameter, which is a description of the measurement.
// the function getStatistics returns an array of objects with the following structure:
// {
//     name: string,
//     startTime: number,
//     endTime: number,
//     duration: number,
//     description: string
// }

import { performance } from "perf_hooks";

export class PerformanceManager {
    private performanceMeasurements: Array<{ name: string; startTime: number; endTime: number; duration: number; description: string }> = [];

    constructor() { }

    startMeasure(name: string, description?: string) {
        this.performanceMeasurements.push({
            name,
            startTime: Date.now(),
            endTime: 0,
            duration: 0,
            description: description || ''
        });
    }

    stopMeasure(name: string) {
        const measurement = this.performanceMeasurements.find((measurement) => measurement.name === name);
        if (measurement) {
            measurement.endTime = performance.now();
            measurement.duration = measurement.endTime - measurement.startTime;
            console.log(`Performance measurement ${name} took ${measurement.duration} milliseconds`);
        }
    }

    getStatistics() {
        return this.performanceMeasurements;
    }
}