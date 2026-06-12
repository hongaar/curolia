export function bottomSheetDragThresholds(sheetHeight: number) {
  return {
    collapse: Math.max(56, sheetHeight * 0.18),
    close: Math.max(120, sheetHeight * 0.42),
  };
}
