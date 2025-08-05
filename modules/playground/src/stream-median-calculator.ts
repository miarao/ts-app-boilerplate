import { printer } from 'misc'

// TODO (om): THERE ARE FEW ERRORS:
//  minHeap is: 3,1,1 length: 3 and maxHeap is: 2,4,5,9 length: 4
//  Numbers: [3, 1, 4, 1, 5, 9, 2]
//  Median: 2
//  ORDER IS INCORRECT, 2 and 3 are in the wrong heaps

export class StreamMedianCalculator {
  private minHeap: number[] = []
  private maxHeap: number[] = []

  constructor() {}

  add(num: number) {
    this.minHeap.push(num)
    this.heapDesc(this.minHeap)

    if (this.minHeap.length > this.maxHeap.length + 1) {
      this.maxHeap.push(this.minHeap.shift()!)
      this.heapAsc(this.maxHeap)
    }

    if (this.maxHeap.length > this.minHeap.length + 1) {
      this.minHeap.push(this.maxHeap.shift()!)
      this.heapDesc(this.minHeap)
    }
  }

  addBatch(nums: number[]) {
    nums.forEach(num => this.add(num))
  }

  findMedian(): number {
    printer(
      `minHeap is: ${this.maxHeap} length: ${this.maxHeap.length} and maxHeap is: ${this.minHeap} length: ${this.minHeap.length}`,
    )

    if (this.minHeap.length > this.maxHeap.length) {
      return this.minHeap[0]
    }
    if (this.maxHeap.length > this.minHeap.length) {
      return this.maxHeap[0]
    }

    // Otherwise they’re equal-sized: average the two roots
    return (this.minHeap[0] + this.maxHeap[0]) / 2
  }

  private heapAsc(arr: number[]) {
    arr.sort((a, b) => b - a)
  }

  private heapDesc(arr: number[]) {
    arr.sort((a, b) => a - b)
  }
}

export function parseNumbers(input: string): number[] {
  let arr: unknown
  try {
    arr = JSON.parse(input)
  } catch {
    throw new Error(`Invalid input format. Expected a JSON array of numbers, e.g. "[1, 2, 3]" received: ${input}`)
  }

  if (!Array.isArray(arr)) {
    throw new Error(`Invalid input: not an array. Got ${typeof arr}`)
  }

  return arr.map((el, idx) => {
    if (typeof el !== 'number' || !Number.isFinite(el)) {
      throw new Error(`Element at index ${idx} is not a valid number: ${JSON.stringify(el)}`)
    }
    return el
  })
}
