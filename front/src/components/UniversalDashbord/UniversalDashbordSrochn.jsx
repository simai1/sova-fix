import React, { useEffect } from 'react';
import * as echarts from 'echarts';

function UniversalDashbordSrochn(props) {
  useEffect(() => {
    var chartDom = document.getElementById('UniversalDashbordSrochn');
    var myChart = echarts.init(chartDom);
    var datas = [
      { value: 0, name: 'В течении недели' },
      { value: 0, name: 'В течении 3-х дней' },
      { value: 0, name: 'В течении текущего дня' },
      { value: 0, name: 'Маршрут' },
    ];

    // Update data values based on props.dataDashbord
    console.log("props?.dataDashbord", props?.dataDashbord)
    props?.dataDashbord.forEach((el) => {
      const index = datas.findIndex(item => item.name === el.urgency);
      if (index !== -1) {
        datas[index].value += 1;
      }
    });

    // // Filter out data entries with zero values
    // const filteredData = datas.filter(item => item.value > 0);

    var option = {
      title: {
        text: 'Срочность',
        left: 'center',
        top: 50
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: 100,
        left: 'center'
      },
      series: [
        {
          name: 'Срочность',
          type: 'pie',
          radius: '50%',
          data: datas,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ],
      color: ['#d69a81', '#ffe78f', '#C5E384', '#B7AB9E'] // Custom colors
    };
   
    option && myChart.setOption(option);

    return () => {
      myChart.dispose();
    };
  }, [props.dataDashbord]); // Add props.dataDashbord as a dependency

  return (
    <div id="UniversalDashbordSrochn" style={{ width: '700px', height: '600px' }}></div>
  );
}

export default UniversalDashbordSrochn;
