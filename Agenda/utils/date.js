Date.prototype.getWeek = function (dowOffset) {
  /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

  dowOffset = typeof (dowOffset) == 'number' ? dowOffset : 0; //default dowOffset to zero
  var newYear = new Date(this.getFullYear(), 0, 1);
  var day = newYear.getDay() - dowOffset; //the day of week the year begins on
  day = (day >= 0 ? day : day + 7);
  var daynum = Math.floor((this.getTime() - newYear.getTime() -
      (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
  var weeknum;
  //if the year starts before the middle of a week
  if (day < 4) {
    weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      nYear = new Date(this.getFullYear() + 1, 0, 1);
      nday = nYear.getDay() - dowOffset;
      nday = nday >= 0 ? nday : nday + 7;
      /*if the next year starts before the middle of
        the week, it is week #1 of that year*/
      weeknum = nday < 4 ? 1 : 53;
    }
  } else {
    weeknum = Math.floor((daynum + day - 1) / 7);
  }
  return weeknum;
};

Date.prototype.getDaysOfWeek = function (weekNumber) {
  if (new Date().getDay() === 0) {
    weekNumber = weekNumber - 1;
  }

  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error('Week number must be between 1 and 53');
  }

  const firstDayOfYear = new Date(this.getFullYear(), 0, 1);

  const days = weekNumber * 7 - 7;

  const datePlusDays = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + days));

  const daysOfWeek = [];

  for (let i = 0; i < 7; i++) {
    if (i === 0) {
      daysOfWeek.push(new Date(datePlusDays));
      continue;
    }

    daysOfWeek.push(new Date(datePlusDays.setDate(datePlusDays.getDate() + 1)));
  }

  return daysOfWeek
}

Date.prototype.getDayOfWeek = function () {
  switch (this.getDay()) {
    case 0:
      return 'Dimanche';
    case 1:
      return 'Lundi';
    case 2:
      return 'Mardi';
    case 3:
      return 'Mercredi';
    case 4:
      return 'Jeudi';
    case 5:
      return 'Vendredi';
    case 6:
      return 'Samedi';
  }
}

Date.prototype.getMonthFromWeek = function (weekNumber) {
  const daysOfWeek = this.getDaysOfWeek(weekNumber);

  switch (daysOfWeek[0].getMonth()) {
    case 0:
      return 'Janvier';
    case 1:
      return 'Février';
    case 2:
      return 'Mars';
    case 3:
      return 'Avril';
    case 4:
      return 'Mai';
    case 5:
      return 'Juin';
    case 6:
      return 'Juillet';
    case 7:
      return 'Août';
    case 8:
      return 'Septembre';
    case 9:
      return 'Octobre';
    case 10:
      return 'Novembre';
    case 11:
      return 'Décembre';
  }
}
