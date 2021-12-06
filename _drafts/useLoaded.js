import {useEffect, useState} from 'react';

export const useLoaded = ({crossOrigin, referrerPolicy, src, srcSet} = {}) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!src && !srcSet) {
            return undefined;
        }

        setLoaded(false);

        let active = true;
        const image = new Image();
        image.onload = () => {
            if (!active) {
                return;
            }
            setLoaded('loaded');
        };
        image.onerror = () => {
            if (!active) {
                return;
            }
            setLoaded('error');
        };
        image.crossOrigin = crossOrigin;
        image.referrerPolicy = referrerPolicy;
        image.src = src;
        if (srcSet) {
            image.srcset = srcSet;
        }

        return () => {
            active = false;
        };
    }, [crossOrigin, referrerPolicy, src, srcSet]);

    return loaded;
};
