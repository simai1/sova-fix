import React, { useEffect } from 'react';
import * as echarts from 'echarts';

function UniversalDashboardStatus(props) {
  useEffect(() => {
    var chartDom = document.getElementById('UniversalDashboardStatus');
    var myChart = echarts.init(chartDom);
    var datas = []
    var colors = []

    props?.statusList?.map(status => {
      datas.push({value: 0, number: status.number, name: status.name})
      colors.push(status?.color)
    })

    // Update data values based on props.dataDashbord
    props?.dataDashbord.forEach((el) => {
      const index = datas.findIndex(item => item.number === el.status);
      if (index !== -1) {
        datas[index].value += 1;
      }
    });

    // Filter out data entries with zero values
    // const filteredData = datas.filter(item => item.value > 0);

    var option = {
      title: {
        text: 'Статусы',
        left: 'center',
        top: 50,
        textStyle: {
          fontWeight: 'normal'
        },
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
          name: 'Статус',
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
      color: colors  // Custom colors
    };
   
    option && myChart.setOption(option);

    return () => {
      myChart.dispose();
    };
  }, [props.dataDashbord]); // Add props.dataDashbord as a dependency

  return (
    <div id="UniversalDashboardStatus" style={{ width: '650px', height: '575px' }}></div>
  );
}

export default UniversalDashboardStatus;
