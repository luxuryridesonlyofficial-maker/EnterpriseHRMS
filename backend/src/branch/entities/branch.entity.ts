export class Branch {
  constructor(partial?: Partial<Branch>) {
    if (partial) Object.assign(this, partial);
  }
}
