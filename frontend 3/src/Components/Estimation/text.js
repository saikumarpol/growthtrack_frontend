const HorizontalTube = ({ value }) => {
  const fillPercent = Math.min(Math.max(((value + 1) / 2) * 100, 0), 100); 
  const VerticalTube = ({ value }) => {
  const fillPercent = Math.min(Math.max(((value + 1) / 2) * 100, 0), 100);