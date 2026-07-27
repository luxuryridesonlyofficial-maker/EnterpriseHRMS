export class Designation {
  constructor(partial?: Partial<Designation>) {
    if (partial) Object.assign(this, partial);
  }
}
