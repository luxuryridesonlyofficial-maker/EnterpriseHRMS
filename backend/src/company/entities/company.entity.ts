export class Company {
  constructor(partial?: Partial<Company>) {
    if (partial) Object.assign(this, partial);
  }
}
