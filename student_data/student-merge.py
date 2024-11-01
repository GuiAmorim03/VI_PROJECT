import pandas as pd

mat = pd.read_csv('student-mat.csv', sep=';')
por = pd.read_csv('student-por.csv', sep=';')


merged_data = pd.merge(
    mat, por,
    on=["school", "sex", "age", "address", "famsize", "Pstatus", 
        "Medu", "Fedu", "Mjob", "Fjob", "reason", "guardian", "traveltime", 
        "activities", "nursery", "higher", "internet", "romantic"],
    suffixes=('_mat', '_por')
)


result = merged_data[["school", "sex", "age", "address", "famsize", "Pstatus", 
                      "Medu", "Fedu", "Mjob", "Fjob", "reason", "guardian", "traveltime",
                      "studytime_mat", "studytime_por", "paid_mat", "paid_por",
                      "activities", "nursery", "higher", "internet", "romantic",
                      "absences_por", "absences_mat",
                       "G3_mat", "G3_por"]]


result.to_csv('merged_grades.csv', index=False)
