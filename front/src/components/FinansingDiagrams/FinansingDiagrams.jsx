import React, { useEffect } from "react";
import * as echarts from 'echarts';

function FinansingDiagrams(props) {
    console.log("DataFinansing", props.DataFinansing);
    let additionalData = [];
    const countMapWithCheck = {};
    const countMapWithoutCheck = {};
    const dataObject = [];
    const countMap = {};
    
    props?.DataFinansing.forEach((el) => {
        const object = el.object;
        const contractor = el.contractor;
        if (!additionalData.includes(contractor)) {
            additionalData.push(contractor);
        }
        dataObject.push(object);
        countMap[object] = (countMap[object] || 0) + 1; // Count occurrences
        if (el.checkPhoto) {
            countMapWithCheck[object] = (countMapWithCheck[object] || 0) + 1;
        } else {
            countMapWithoutCheck[object] = (countMapWithoutCheck[object] || 0) + 1;
        }
    });
    
    const uniqueDataObject = [...new Set(dataObject)];
    const countsWithCheck = uniqueDataObject.map(obj => countMapWithCheck[obj] || 0);
    const countsWithoutCheck = uniqueDataObject.map(obj => countMapWithoutCheck[obj] || 0)
    
    useEffect(() => {
        var chartDom = document.getElementById('diagrams');
        var myChart = echarts.init(chartDom);
        
        var option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
            },
            color:["#ffe78f", "#C5E384"],
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
                    data: uniqueDataObject,
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
            legend: {
                bottom: -5,
                left: 'center'
              },
            series: [
                {
                    name: 'Количество заявок без чека', // Updated series name
                    type: 'bar',
                    barWidth: '10%',
                    color: "#ffe78f",
                    data: countsWithoutCheck, // Using the counts array hereы
                },
                {
                    name: 'Количество заявок c чеком', // Updated series name
                    type: 'bar',
                    barWidth: '10%',
                    color: "#C5E384",
                    data: countsWithCheck // Using the counts array here
                }
            ]
        };

        myChart.setOption(option);

        return () => {
            myChart.dispose();
        };
    }, [dataObject, countsWithCheck]); // Add dependencies for useEffect

    return (
        <main id="diagrams" style={{ width: '100%', height: '55vh' }}>
            {/* The chart will be rendered here */}
        </main>
    );
}

export default FinansingDiagrams;
