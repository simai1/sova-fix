import React, { useEffect } from "react";
import * as echarts from 'echarts';

function FinansingDiagrams(props) {
    useEffect(() => {
        var chartDom = document.getElementById('diagrams');
        var myChart = echarts.init(chartDom);
        
        var option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
                    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    axisTick: {
                        alignWithLabel: true
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: [
                {
                    name: 'Direct',
                    type: 'bar',
                    barWidth: '20%',
                    data: [10, 52, 200, 334, 390, 330, 220]
                }
            ]
        };

        myChart.setOption(option);

        return () => {
            myChart.dispose();
        };
    }, []);

    return (
        <main id="diagrams" style={{ width: '100%', height: '400px' }}>
            {/* The chart will be rendered here */}
        </main>
    );
}

export default FinansingDiagrams;
