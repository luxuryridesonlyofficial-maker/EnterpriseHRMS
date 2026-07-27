export class Department {
  constructor(partial?: Partial<Department>) {
    if (partial) Object.assign(this, partial);
  }
}
