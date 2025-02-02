import { Injectable } from "@angular/core"
import { Observable, Subject, timer } from "rxjs"
import { concatMap, tap } from "rxjs/operators"

@Injectable({
  providedIn: "root",
})
export class RateLimiterService {
  private queue$ = new Subject<() => Observable<any>>()
  private processing = false
  private operationsPerSecond = 10 // Adjust this value based on your quota limits

  constructor() {
    this.processQueue()
  }

  private processQueue() {
    this.queue$
      .pipe(
        concatMap((operation) =>
          timer(1000 / this.operationsPerSecond).pipe(
            tap(() => (this.processing = true)),
            concatMap(() => operation()),
            tap(() => (this.processing = false)),
          ),
        ),
      )
      .subscribe()
  }

  enqueue<T>(operation: () => Observable<T>): Observable<T> {
    return new Observable<T>((observer) => {
      this.queue$.next(
        () =>
          new Observable<T>((innerObserver) => {
            operation().subscribe({
              next: (value) => {
                observer.next(value)
                innerObserver.next(value)
              },
              error: (err) => {
                observer.error(err)
                innerObserver.error(err)
              },
              complete: () => {
                observer.complete()
                innerObserver.complete()
              },
            })
          }),
      )
    })
  }

  setOperationsPerSecond(ops: number) {
    this.operationsPerSecond = ops
  }

  isProcessing(): boolean {
    return this.processing
  }
}

