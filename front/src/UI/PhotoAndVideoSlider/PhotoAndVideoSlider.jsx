import React, { useState } from "react";
import styles from "./PhotoAndVideoSlider.module.scss";
import { API_URL } from "../../constants/env.constant";

const PhotoAndVideoSlider = (props) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(props?.initialIndex ?? 0);
    
    const nextSlide = () => {
        setCurrentSlideIndex((prev) => (prev + 1) % props?.sliderPhotos.length);
      };
    
      const prevSlide = () => {
        setCurrentSlideIndex(
          (prev) => (prev - 1 + props?.sliderPhotos.length) % props?.sliderPhotos.length
        );
      };

    const isVideo = (fileName) => {
        if (!fileName) return false;
        const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".mkv"];
        return videoExtensions.some((ext) => fileName.endsWith(ext));
      };

    return (
        <div className={styles.photoSlider}>
            <div className={styles.sliderContent}>
                <button className={styles.closeSlider} onClick={props?.closeSlider}>
                    ×
                </button>
                <div className={styles.sliderControls}>
                    <button className={styles.prevButton} onClick={prevSlide}>
                        ❮
                    </button>
                    {isVideo(props?.sliderPhotos[currentSlideIndex]) ? (
                        <video
                            className={styles.sliderVideo}
                            controls
                            src={`${API_URL}/uploads/${
                                props?.sliderPhotos[currentSlideIndex]
                            }`}
                        >
                            <source
                                src={`${
                                    API_URL
                                }/uploads/${
                                    props?.sliderPhotos[
                                        currentSlideIndex
                                    ]
                                }`}
                            />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <img
                            src={`${API_URL}/uploads/${
                                props?.sliderPhotos[currentSlideIndex]
                            }`}
                            alt={`Slide ${currentSlideIndex + 1}`}
                            className={styles.sliderImage}
                        />
                    )}
                    <button className={styles.nextButton} onClick={nextSlide}>
                        ❯
                    </button>
                </div>
                <div className={styles.sliderIndicator}>
                    {currentSlideIndex + 1} / {props?.sliderPhotos.length}
                </div>
            </div>
        </div>
    );
};

export default PhotoAndVideoSlider;
