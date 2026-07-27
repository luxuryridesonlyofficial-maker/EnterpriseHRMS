export class Employee {
  constructor(partial?: Partial<Employee>) {
    if (partial) Object.assign(this, partial);
  }
}
