# Shit's on fire, yo

Another implementation of the basic pixel fire algorithm. Mostly a
'Funcitonal Programming' excersise, or at least me trying to start
thinking functionally.

## Algorithm

1. Start with a grid of cells of width `cols` and height `rows`

2. Randomise the values of the bottom row

3. Create a new grid of the same size

4. For each element of the new grid 
    * if the element is in the last row
       -  skip it
    * else
        - get the values of the cells from the old grid
            - below and to the left
            - below and to the right
            - directly below by one
            - directly below by two
        - average those values
        - store the value in the new grid

5. Render the grid

6. Ovewright the old grid with the new grid

7. Goto step 2


            
