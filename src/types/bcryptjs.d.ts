declare module 'bcryptjs' {
  export function hashSync(s: string, saltOrRounds?: number): string;
  export function compareSync(s: string, hash: string): boolean;
  export default { hashSync, compareSync };
}
