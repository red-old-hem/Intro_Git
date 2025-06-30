from datetime import date, timedelta

import holidays
from flask import Flask, render_template, request

app = Flask(__name__)

jp_holidays = holidays.Japan()


def is_business_day(d):
    return d.weekday() < 5 and d not in jp_holidays


def next_business_day(d):
    nd = d + timedelta(days=1)
    while not is_business_day(nd):
        nd += timedelta(days=1)
    return nd


def add_business_days(d, days):
    nd = d
    for _ in range(days):
        nd = next_business_day(nd)
    return nd


@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    if request.method == 'POST':
        order_date_str = request.form['order_date']
        lead_time = int(request.form['lead_time'])
        order_date = date.fromisoformat(order_date_str)
        ship_date = next_business_day(order_date)
        delivery_date = add_business_days(ship_date, lead_time)
        # If delivery lands on weekend/holiday, push to next business day
        while not is_business_day(delivery_date):
            delivery_date = next_business_day(delivery_date)
        result = {
            'order_date': order_date,
            'ship_date': ship_date,
            'delivery_date': delivery_date,
            'lead_time': lead_time,
        }
    return render_template('index.html', result=result)


if __name__ == '__main__':
    app.run(debug=True)
