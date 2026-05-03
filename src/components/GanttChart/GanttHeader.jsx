import { useMemo } from 'react';

function GanttHeader({ startDate, endDate, pixelsPerDay }) {
  const days = useMemo(() => {
    const result = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate, endDate]);

  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return { month, day, weekday };
  };

  const weeks = useMemo(() => {
    const result = [];
    let currentWeek = null;
    days.forEach((day, idx) => {
      const weekNum = getWeekNumber(day);
      if (!currentWeek || currentWeek.week !== weekNum) {
        if (currentWeek) result.push(currentWeek);
        currentWeek = { week: weekNum, days: [], startIdx: idx };
      }
      currentWeek.days.push(day);
    });
    if (currentWeek) result.push(currentWeek);
    return result;
  }, [days]);

  function getWeekNumber(date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date - firstDay) / 86400000;
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  }

  return (
    <div className="gantt-header flex border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
      <div className="project-label w-40 flex-shrink-0 px-2 py-2 font-semibold text-sm text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">
        项目
      </div>
      <div className="timeline-header flex-1 overflow-x-auto">
        <div className="flex">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
              <div className="px-1 py-0.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 text-center">
                第{week.week}周
              </div>
              <div className="flex">
                {week.days.map((day, di) => {
                  const { month, day: d, weekday } = formatDate(day);
                  const isWeekend = weekday === '六' || weekday === '日';
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={di}
                      className={`flex-shrink-0 text-center border-r border-gray-100 dark:border-gray-700 ${isWeekend ? 'bg-gray-50 dark:bg-gray-800' : ''} ${isToday ? 'bg-red-100 dark:bg-red-900' : ''}`}
                      style={{ width: pixelsPerDay, minWidth: pixelsPerDay }}
                    >
                      <div className={`text-xs ${isToday ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {month}/{d}
                      </div>
                      <div className={`text-xs ${isToday ? 'text-red-600 dark:text-red-400 font-bold' : isWeekend ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                        {weekday}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GanttHeader;
