export class User {
  constructor(partial?: Partial<User>) {
    if (partial) Object.assign(this, partial);
  }
}
