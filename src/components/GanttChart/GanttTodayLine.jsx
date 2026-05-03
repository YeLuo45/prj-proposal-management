function GanttTodayLine({ startDate, pixelsPerDay }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const left = daysDiff * pixelsPerDay + pixelsPerDay / 2;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left: left }}
    >
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 rounded">
        今日
      </div>
    </div>
  );
}

export default GanttTodayLine;
