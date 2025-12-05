export class DriverNotFoundError extends Error {
  constructor(driverName: string) {
    super("");
    this.message = `Driver '${driverName}' not found, it's likely not installed, try running 'npm install ${driverName}'`;
  }
}
