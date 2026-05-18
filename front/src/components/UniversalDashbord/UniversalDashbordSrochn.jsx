import React, { useEffect } from 'react';
import * as echarts from 'echarts';

function UniversalDashbordSrochn(props) {
  useEffect(() => {
    var chartDom = document.getElementById('UniversalDashbordSrochn');
    var myChart = echarts.init(chartDom);

    var datas = []
    var colors = []

    props?.urgencyList.map(urgency => {
      datas?.push({value: 0, name: urgency?.name})
      colors?.push(urgency?.color)
    })


    props?.dataDashbord.forEach((el) => {
      const index = datas.findIndex(item => item.name === el.urgency);
      if (index !== -1) {
        datas[index].value += 1;
      }
    });

    var option = {
      title: {
        text: 'Срочность',
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
      color: colors
    };
   
    option && myChart.setOption(option);

    return () => {
      myChart.dispose();
    };
  }, [props.dataDashbord]);

  return (
    <div id="UniversalDashbordSrochn" style={{ width: '650px', height: '575px' }}></div>
  );
}

export default UniversalDashbordSrochn;
