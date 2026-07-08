export abstract class BaseDto {
  toDict(): Record<string, any> {
    const serialize = (val: any): any => {
      if (val === null || val === undefined) return val;
      if (val instanceof BaseDto) return val.toDict();
      if (Array.isArray(val)) return val.map(serialize);
      if (typeof val === 'object') {
        // Plain objects mapping
        if (val.constructor === Object) {
          const result: Record<string, any> = {};
          for (const key of Object.keys(val)) {
            result[key] = serialize(val[key]);
          }
          return result;
        }
      }
      return val;
    };

    // Serialize current object properties
    const result: Record<string, any> = {};
    for (const key of Object.keys(this)) {
      result[key] = serialize((this as any)[key]);
    }
    return result;
  }
}
