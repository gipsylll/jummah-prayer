// Обновление даты Хиджры
export const getHijriDate = () => {
    // Упрощенная конверсия (для точности нужна библиотека)
    const now = new Date();
    const gregorianYear = now.getFullYear();
    const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
    
    // Более точный расчет месяца и дня
    const daysSinceEpoch = Math.floor((now - new Date(622, 6, 16)) / (1000 * 60 * 60 * 24));
    const hijriDays = Math.floor(daysSinceEpoch * 0.970224);
    
    // Приблизительный расчет месяца (29-30 дней в месяце Хиджры)
    const hijriMonth = Math.floor((hijriDays % 354) / 29.5) + 1;
    const hijriDay = (hijriDays % 29.5) + 1;
    
    const monthNames = [
        'Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани',
        'Джумада аль-уля', 'Джумада ас-сани', 'Раджаб', 'Шаабан',
        'Рамадан', 'Шавваль', 'Зуль-када', 'Зуль-хиджа'
    ];
    
    return {
        year: hijriYear,
        month: hijriMonth,
        day: Math.floor(hijriDay),
        monthName: monthNames[hijriMonth - 1] || '',
        formatted: `${hijriYear} г.`
    };
};
