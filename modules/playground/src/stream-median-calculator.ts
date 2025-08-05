class StreamMedianCalculator {
  private maxHeap: number[] = []
  private minHeap: number[] = []

  constructor() {}

  add(num: number) {
    this.maxHeap.push(num)
    this.heapAsc(this.maxHeap)

    if (this.maxHeap.length > this.minHeap.length + 1) {
      this.minHeap.push(this.maxHeap.shift()!)
      this.heapDesc(this.minHeap)
    }

    if (this.minHeap.length > this.maxHeap.length + 1) {
      this.maxHeap.push(this.minHeap.shift()!)
      this.heapAsc(this.maxHeap)
    }
  }

  addBatch(nums: number[]) {
    nums.forEach(num => this.add(num))
  }

  findMedian() {
    if (this.minHeap.length > this.maxHeap.length) {
      return this.minHeap[0]
    }
    return (this.minHeap[0] + this.maxHeap[0]) / 2
  }

  private heapAsc(arr: number[]) {
    arr.sort((a, b) => b - a)
  }

  private heapDesc(arr: number[]) {
    arr.sort((a, b) => a - b)
  }
}
