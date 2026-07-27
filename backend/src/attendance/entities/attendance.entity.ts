export class Attendance {
  constructor(partial?: Partial<Attendance>) {
    if (partial) Object.assign(this, partial);
  }
}
