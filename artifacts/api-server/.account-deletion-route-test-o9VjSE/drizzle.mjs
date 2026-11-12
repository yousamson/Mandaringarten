
    export const eq = (column, value) => ({ kind: "eq", column, value });
    export const inArray = (column, values) => ({ kind: "inArray", column, values });
    export const desc = (column) => ({ kind: "desc", column });
  